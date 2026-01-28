exports.handler = async (event) => {
  const source = event.path.split("/").pop();

  if (!source) {
    return { statusCode: 400, body: "Missing source" };
  }

  const base = "https://coachingsociety.typeform.com/application";

  // Keep attribution in Typeform via UTMs (and source stays in the Typeform 'source' param)
  const target =
    `${base}` +
    `?source=${encodeURIComponent(source)}` +
    `&utm_source=sponsored` +
    `&utm_medium=referral` +
    `&utm_campaign=coaching_society` +
    `&utm_content=${encodeURIComponent(source)}`;

  return {
    statusCode: 302,
    headers: { Location: target },
  };
};
