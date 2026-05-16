'use strict';
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
  }),
];

// Only add file logging if NOT in production/serverless
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  transports.push(
    new DailyRotateFile({
      filename     : path.join('logs', 'error-%DATE%.log'),
      datePattern  : 'YYYY-MM-DD',
      level        : 'error',
      maxFiles     : '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename     : path.join('logs', 'combined-%DATE%.log'),
      datePattern  : 'YYYY-MM-DD',
      maxFiles     : '14d',
      zippedArchive: true,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports,
});

module.exports = logger;
