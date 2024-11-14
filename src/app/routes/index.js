const { apiV1Prefix } = require('../../config/default.json');

module.exports = (app) => {
  app.use(`${apiV1Prefix}/swagger`, require('./swaggerRoutes'));
  app.use(`${apiV1Prefix}/provider`, require('./providerRoutes'));
  app.use(`${apiV1Prefix}/taxitype`, require('./taxiTypeRoutes'));
};
