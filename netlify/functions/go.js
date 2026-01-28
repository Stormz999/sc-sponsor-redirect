const mapping = require("./store.json");

exports.handler = async (event) => {
  const source = event.path.split("/").pop();

  if (!source) {
    return {
      statusCode: 400,
      body: "Missing source"
    };
  }

  const target = mapping[source];

  if (!target) {
    return {
      statusCode: 404,
      body: "Unknown source"
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: target
    }
  };
};
