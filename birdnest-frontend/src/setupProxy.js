const { createProxyMiddleware } = require('http-proxy-middleware');
/*  Proxy requests to backend. Environment variale is defined by Heroku
    on the production server. There is no need to call this function,
    it is executed automatically. */
module.exports = function(app) {
  app.use(
    '/stream',
    createProxyMiddleware({
      target: `http://localhost:${process.env.PORT || 8080}`,
      changeOrigin: true,
    })
  );
};