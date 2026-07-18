// Vercel serverless entry — delegates every request to the compiled Nest app.
// Plain JS on purpose: the app is prebuilt by `npm run build` (tsc emits
// decorator metadata, which Vercel's TS bundler does not).
const { getServer } = require('../dist/vercel-app');

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
