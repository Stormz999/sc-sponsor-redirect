export default async (req) => {
  // URL pattern: /.netlify/functions/go/:source
  const url = new URL(req.url);
  const source = url.pathname.split("/").pop(); // last segment

  if (!source) {
    return new Response("Missing source", { status: 400 });
  }

  // TEMP redirect target (we'll replace this with your real lookup next step)
  const target = `https://coachingsociety.typeform.com/application?source=${encodeURIComponent(source)}`;

  return new Response(null, {
    status: 302,
    headers: { Location: target },
  });
};
