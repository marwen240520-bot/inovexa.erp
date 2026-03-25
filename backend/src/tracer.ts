const tracer = require('dd-trace').init({
  service: 'inovexa-erp-backend',
  env: process.env.NODE_ENV,
  version: '1.0.0',
  logInjection: true,
  runtimeMetrics: true,
});

export default tracer;
