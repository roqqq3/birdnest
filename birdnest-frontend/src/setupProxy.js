const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/stream',
    createProxyMiddleware({
      target: `http://localhost:${process.env.PORT}`,
      changeOrigin: true,
    })
  );
};