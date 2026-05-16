'use strict';
require('dotenv').config();
const { app } = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 IT Infra ERP API running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`📖 Base URL: http://localhost:${PORT}/v1`);
});
