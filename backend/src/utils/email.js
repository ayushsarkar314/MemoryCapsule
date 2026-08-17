const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter using Gmail SMTP.
 * Requires EMAIL_FROM and EMAIL_PASS env vars (Gmail App Password).
 */
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT == '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends a password-reset email to the given address.
 * @param {string} to       - Recipient email address
 * @param {string} resetUrl - Full reset URL (e.g. https://…/reset-password?token=…)
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your Memory Capsule password</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:36px 40px;text-align:center;">
              <div style="font-size:2.5rem;">🫙</div>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:1.5rem;font-weight:700;letter-spacing:-0.5px;">
                Memory Capsule
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:1.25rem;font-weight:700;">
                Reset your password
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:0.95rem;line-height:1.6;">
                We received a request to reset the password for your Memory Capsule account.
                Click the button below to choose a new password. This link expires in
                <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);
                          color:#ffffff;text-decoration:none;padding:14px 36px;
                          border-radius:12px;font-size:1rem;font-weight:700;
                          letter-spacing:0.3px;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
                  Reset Password
                </a>
              </div>

              <p style="margin:0 0 8px;color:#9ca3af;font-size:0.8rem;line-height:1.6;text-align:center;">
                Or paste this URL into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;color:#f59e0b;font-size:0.78rem;text-align:center;">
                ${resetUrl}
              </p>

              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />

              <p style="margin:0;color:#9ca3af;font-size:0.8rem;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fdf8f2;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#d1d5db;font-size:0.75rem;">
                © ${new Date().getFullYear()} Memory Capsule — Your memories, preserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"Memory Capsule 🫙" <${process.env.SMTP_FROM || 'noreply@memorycapsule.com'}>`,
    to,
    subject: 'Reset your Memory Capsule password',
    html,
  });
};

/**
 * Sends an email verification link to the given address.
 * @param {string} to        - Recipient email address
 * @param {string} verifyUrl - Full verification URL (e.g. https://…/verify-email?token=…)
 */
const sendVerificationEmail = async (to, verifyUrl) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your Memory Capsule email</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:36px 40px;text-align:center;">
              <div style="font-size:2.5rem;">✨</div>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:1.5rem;font-weight:700;letter-spacing:-0.5px;">
                Verify Your Account
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:1.25rem;font-weight:700;">
                Welcome to Memory Capsule!
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:0.95rem;line-height:1.6;">
                Thank you for creating an account. Please verify your email address by clicking the button below. This link expires in 24 hours.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);
                          color:#ffffff;text-decoration:none;padding:14px 36px;
                          border-radius:12px;font-size:1rem;font-weight:700;
                          letter-spacing:0.3px;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
                  Verify Email Address
                </a>
              </div>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:0.8rem;line-height:1.6;text-align:center;">
                Or paste this URL into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;color:#f59e0b;font-size:0.78rem;text-align:center;">
                ${verifyUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Memory Capsule 🫙" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verify your Memory Capsule email address',
      html,
    });
    console.log(`[Email Sent] Verification email delivered to ${to}`);
  } catch (err) {
    console.error('[Email Sending Error]:', err.message);
    console.log('[Email Fallback] Verification link generated:', verifyUrl);
  }
};

/**
 * Sends a 6-digit OTP verification email to the given address.
 * @param {string} to  - Recipient email address
 * @param {string} otp - 6-digit OTP string
 */
const sendOTPEmail = async (to, otp) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verification Code - Memory Capsule</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:36px 40px;text-align:center;">
              <div style="font-size:2.5rem;">🔑</div>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:1.5rem;font-weight:700;letter-spacing:-0.5px;">
                Verification Code
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:1.25rem;font-weight:700;">
                Verify Your Account Registration
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:0.95rem;line-height:1.6;">
                Use the following 6-digit verification code to complete your account creation. This code is valid for <strong>10 minutes</strong>.
              </p>
              
              <div style="display:inline-block;background:#fff8f0;border:2px dashed #f59e0b;padding:16px 36px;border-radius:16px;margin:16px 0;">
                <span style="font-size:2.5rem;font-weight:800;letter-spacing:10px;color:#d97706;font-family:monospace;">
                  ${otp}
                </span>
              </div>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:0.8rem;line-height:1.6;">
                If you did not request this verification code, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Memory Capsule 🫙" <${process.env.SMTP_USER}>`,
      to,
      subject: `${otp} is your Memory Capsule verification code`,
      html,
    });
    console.log(`[OTP Sent] Verification code ${otp} delivered to ${to}`);
  } catch (err) {
    console.error('[OTP Sending Error]:', err.message);
    console.log(`[OTP Fallback] OTP for ${to}: ${otp}`);
  }
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendOTPEmail };
