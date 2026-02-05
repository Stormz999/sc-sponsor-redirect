// netlify/functions/go.js

const CLICK_LOG_URL = "https://n8n-service-ucto.onrender.com/webhook/click-log";
const DEDUPE_WINDOW_SECONDS = 60;

function getHeader(event, name) {
  const h = event.headers || {};
  const key = Object.keys(h).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? h[key] : "";
}

function isBotUserAgent(uaRaw) {
  const ua = (uaRaw || "").toLowerCase();

  // Known unfurlers / preview bots
  if (ua.includes("slackbot")) return true;
  if (ua.includes("linkexpanding")) return true;
  if (ua.includes("facebookexternalhit")) return true;
  if (ua.includes("discordbot")) return true;
  if (ua.includes("telegrambot")) return true;
  if (ua.includes("whatsapp")) return true;

  // Generic bot signals
  if (ua.includes("bot")) return true;
  if (ua.includes("crawler")) return true;
  if (ua.includes("spider")) return true;
  if (ua.includes("preview")) return true;

  return false;
}

exports.handler = async (event) => {
  const source = event.path.split("/").pop();

  if (!source) {
    return { statusCode: 400, body: "Missing source" };
  }

  // Build Typeform destination
  const base = "https://coachingsociety.typeform.com/application";
  const target =
    `${base}` +
    `?source=${encodeURIComponent(source)}` +
    `&utm_source=sponsored` +
    `&utm_medium=referral` +
    `&utm_campaign=coaching_society` +
    `&utm_content=${encodeURIComponent(source)}`;

  const ua = getHeader(event, "user-agent");
  const referer = getHeader(event, "referer") || getHeader(event, "referrer") || "";

  // IP (best-effort)
  const xff = getHeader(event, "x-forwarded-for");
  const ip = (xff || "").split(",")[0].trim();

  // Skip logging for bots/unfurlers, but still redirect
  const bot = isBotUserAgent(ua);

  // Dedupe key (source + ip + ua). Prevent double logs from previews/reloads.
  const dedupeKey = `sc_dedupe_${source}_${ip}_${ua}`.slice(0, 200);

  let shouldLog = !bot;

  if (shouldLog && event.clientContext && event.clientContext.custom && event.clientContext.custom.netlify) {
    // no-op, leaving here in case you add Netlify Identity later
  }

  try {
    if (shouldLog) {
      // simple in-memory dedupe via Netlify function "cache" is not reliable across instances,
      // so we use a short-lived cookie-based dedupe instead.
      // If cookie exists, skip logging.
      const cookie = getHeader(event, "cookie");
      if (cookie && cookie.includes(`${encodeURIComponent(dedupeKey)}=`)) {
        shouldLog = false;
      }
    }
  } catch (_) {}

  // Fire-and-forget log (bounded)
  if (shouldLog) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 250);

      // Don’t await long, but do await up to timeout so it usually reaches n8n
      await fetch(CLICK_LOG_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ts: new Date().toISOString(),
          source,
          ua,
          referer,
          ip,
        }),
        signal: controller.signal,
      }).catch(() => {});

      clearTimeout(timeout);
    } catch (_) {
      // ignore
    }
  }

  // Set a short dedupe cookie so refresh/unfurl doesn’t double log
  // Cookie lives 60s, path is this function only.
  const cookieVal = `${encodeURIComponent(dedupeKey)}=1; Max-Age=${DEDUPE_WINDOW_SECONDS}; Path=/.netlify/functions/go; Secure; SameSite=Lax`;

  return {
    statusCode: 302,
    headers: {
      Location: target,
      "Set-Cookie": cookieVal,
      "Cache-Control": "no-store",
    },
  };
};
