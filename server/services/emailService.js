import nodemailer from "nodemailer";

/**
 * Configure Nodemailer Transporter
 */
const getTransporter = () => {
  // Option 1: Custom SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Option 2: Gmail service with App Password (e.g. campuscyclesrc@gmail.com)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return null;
};

/**
 * Send a verification code to a user's email address
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.code - 6-digit verification code
 * @returns {Promise<{success: boolean, sent: boolean, devCode?: string}>}
 */
export const sendVerificationEmail = async ({ to, name, code }) => {
  const transporter = getTransporter();
  const senderEmail = process.env.EMAIL_USER || process.env.SMTP_USER || "noreply@campuscycle.edu";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CampusCycle Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; text-align: center; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .code-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 16px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px; }
        .code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: monospace; }
        .expiry { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CampusCycle</h1>
          <p>Asian School of Business • Campus Second-Hand Marketplace</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name ? name.trim() : "Student"},</div>
          <p class="desc">
            Thank you for registering on CampusCycle! Please use the 6-digit verification code below to confirm your email and complete your account creation.
          </p>
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expiry">Expires in 10 minutes</div>
          </div>
          <p class="desc" style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
            If you did not request this verification code, please ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CampusCycle. Built for Asian School of Business.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    // Log prominently for development / debugging
    console.log("==================================================");
    console.log(`[EMAIL DISPATCH - DEV SIMULATION]`);
    console.log(`To: ${to}`);
    console.log(`Recipient: ${name}`);
    console.log(`VERIFICATION CODE: ${code}`);
    console.log(`Expires in: 10 minutes`);
    console.log("Tip: Set EMAIL_USER and EMAIL_PASS in server/.env for real SMTP delivery.");
    console.log("==================================================");
    return { success: true, sent: false, devCode: code };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CampusCycle" <${senderEmail}>`,
      to,
      subject: `Your CampusCycle Verification Code: ${code}`,
      html: emailHtml
    });

    console.log(`[EMAIL DISPATCH] Verification code sent to ${to} (MessageId: ${info.messageId})`);
    return { success: true, sent: true };
  } catch (error) {
    console.error(`[EMAIL DISPATCH ERROR] Failed sending to ${to}:`, error.message);
    // Even if transporter fails, log code in console so developer/user isn't locked out
    console.log(`[VERIFICATION CODE FALLBACK FOR ${to}]: ${code}`);
    return { success: true, sent: false, devCode: code, error: error.message };
  }
};
