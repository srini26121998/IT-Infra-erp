const { execSync } = require('child_process');

const envs = {
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5173,http://localhost:4200,https://it-infr-erp-backend-develop.vercel.app',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  SMTP_USER: 'your_email@gmail.com',
  SMTP_PASS: 'your_app_password',
  EMAIL_FROM: 'IT Infra ERP <no-reply@infraerp.com>',
  OTP_EXPIRES_MINUTES: '10'
};

for (const [key, value] of Object.entries(envs)) {
  try {
    console.log(`Adding ${key}...`);
    execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
  } catch (err) {
    console.error(`Failed to add ${key}`);
  }
}
console.log('Done adding envs.');
