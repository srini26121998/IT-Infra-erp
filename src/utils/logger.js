'use strict';
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console output (coloured in dev)
    new winston.transports.Console({
      format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    // Daily rotating file — errors
    new DailyRotateFile({
      filename     : path.join('logs', 'error-%DATE%.log'),
      datePattern  : 'YYYY-MM-DD',
      level        : 'error',
      maxFiles     : '30d',
      zippedArchive: true,
    }),
    // Daily rotating file — combined
    new DailyRotateFile({
      filename     : path.join('logs', 'combined-%DATE%.log'),
      datePattern  : 'YYYY-MM-DD',
      maxFiles     : '14d',
      zippedArchive: true,
    }),
  ],
});

module.exports = logger;
