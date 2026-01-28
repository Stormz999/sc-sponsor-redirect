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

  // Fire-and-forget click log (does NOT block redirect)
  const clickLogUrl = "https://n8n-service-ucto.onrender.com/webhook/click-log";

  try {
    fetch(clickLogUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ts: new Date().toISOString(),
        source,
        ua: event.headers["user-agent"] || "",
        referer: event.headers["referer"] || event.headers["referrer"] || "",
        ip: (event.headers["x-forwarded-for"] || "").split(",")[0].trim(),
      }),
    }).catch(() => {});
  } catch (e) {
    // ignore logging failures
  }

  // Redirect immediately
  return {
    statusCode: 302,
    headers: { Location: target },
  };
};
