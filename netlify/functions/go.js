exports.handler = async (event) => {
  const source = event.path.split("/").pop();

  if (!source) {
    return { statusCode: 400, body: "Missing source" };
  }

  // Build Typeform destination (fast, no lookups)
  const base = "https://coachingsociety.typeform.com/application";
  const target =
    `${base}` +
    `?source=${encodeURIComponent(source)}` +
    `&utm_source=sponsored` +
    `&utm_medium=referral` +
    `&utm_campaign=coaching_society` +
    `&utm_content=${encodeURIComponent(source)}`;

  // Click log (WAIT briefly so it actually sends)
  const clickLogUrl = "https://n8n-service-ucto.onrender.com/webhook/click-log";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300); // 300ms max

    await fetch(clickLogUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ts: new Date().toISOString(),
        source,
        ua: event.headers["user-agent"] || "",
        referer: event.headers["referer"] || event.headers["referrer"] || "",
        ip: (event.headers["x-forwarded-for"] || "").split(",")[0].trim(),
      }),
      signal: controller.signal,
    }).catch(() => {});

    clearTimeout(timeout);
  } catch (e) {
    // ignore logging failures
  }

  // Redirect
  return {
    statusCode: 302,
    headers: { Location: target },
  };
};
