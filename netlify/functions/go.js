import mapping from "./store.json" assert { type: "json" };

export default async (req) => {
  // URL pattern: /.netlify/functions/go/:source
  const url = new URL(req.url);
  const source = url.pathname.split("/").pop(); // last segment

  if (!source) {
    return new Response("Missing source", { status: 400 });
  }

  const target = mapping[source];

  if (!target) {
    return new Response("Unknown source", { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target },
  });
};
