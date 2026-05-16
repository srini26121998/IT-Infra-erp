'use strict';
const nodemailer = require('nodemailer');
const logger     = require('./logger');

const transporter = nodemailer.createTransport({
  host  : process.env.SMTP_HOST,
  port  : Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth  : {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an OTP email.
 * @param {string} to      Recipient email
 * @param {string} otp     Plain-text OTP
 * @param {'signup'|'forgot_password'} type
 */
const sendOtpEmail = async (to, otp, type) => {
  const subject = type === 'signup'
    ? 'Verify your email — IT Infra ERP'
    : 'Password Reset OTP — IT Infra ERP';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1e3a5f">IT Infra ERP</h2>
      <p>${type === 'signup' ? 'Welcome! Please verify your email.' : 'You requested a password reset.'}</p>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:8px;color:#2563eb">${otp}</h1>
      <p>This OTP expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>
      <p style="color:#888;font-size:12px">If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from   : process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info(`OTP email sent to ${to} [msgId: ${info.messageId}]`);
    return info;
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}: ${err.message}`);
    // In development, we log the OTP to console so the user isn't stuck
    console.log('\n' + '='.repeat(50));
    console.log(`📧 DEVELOPMENT OTP FOR ${to}: ${otp}`);
    console.log('='.repeat(50) + '\n');
    return null; 
  }
};

module.exports = { sendOtpEmail };
