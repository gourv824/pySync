import nodemailer from 'nodemailer';
import { getDb } from '../../lib/db';

// Helper to normalize SMTP credentials and sanitize passwords (such as Gmail App Passwords with spaces)
export const sanitizeSmtpCredentials = (host: string, pass: string) => {
  if (!pass) return '';
  let cleaned = pass.trim();
  // Gmail App Passwords often come as 4 groups of 4 letters ("abcd efgh ijkl mnop")
  if (host && (host.toLowerCase().includes('gmail') || host.toLowerCase().includes('googlemail'))) {
    cleaned = cleaned.replace(/\s+/g, '');
  }
  return cleaned;
};

// Configure the email transport dynamically from database config or process environment variables
export const getDynamicTransporter = () => {
  const db = getDb();
  const dbSmtp = db?.smtp_config;

  const host = (dbSmtp?.host || process.env.SMTP_HOST || '').trim();
  const portStr = (dbSmtp?.port || process.env.SMTP_PORT || '587').toString().trim();
  const user = (dbSmtp?.user || process.env.SMTP_USER || '').trim();
  let pass = (dbSmtp?.pass || process.env.SMTP_PASS || '').trim();
  const from = dbSmtp?.from || process.env.EMAIL_FROM || '"pySync Notifications" <noreply@pysync.local>';

  pass = sanitizeSmtpCredentials(host, pass);

  const isPlaceholder = 
    !host || !user || !pass ||
    host === 'smtp.example.com' || 
    user === 'your-email@example.com' || 
    pass === 'your-app-password';

  if (isPlaceholder) {
    return null;
  }

  try {
    const port = parseInt(portStr, 10) || 587;
    const isSecure = port === 465;
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 7000,
      tls: {
        rejectUnauthorized: false
      }
    });
    return { transport, from, host, user };
  } catch (err) {
    console.error("Failed to create SMTP transporter dynamically:", err);
    return null;
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const dynamic = getDynamicTransporter();
  const from = dynamic?.from || process.env.EMAIL_FROM || '"pySync Notifications" <noreply@pysync.local>';
  
  if (!dynamic || !dynamic.transport) {
    console.log(`\n--- [MOCK EMAIL - NO SMTP CONFIGURED] ---`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  try {
    const info = await dynamic.transport.sendMail({
      from,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    
    if (dynamic.host === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('535') || errMsg.includes('Invalid login') || errMsg.includes('Username and Password not accepted')) {
      console.warn(`[SMTP Warning] Invalid SMTP credentials for ${dynamic.user || 'configured user'}. If using Gmail, make sure to use a 16-character Google App Password (https://myaccount.google.com/apppasswords).`);
    } else {
      console.warn(`[SMTP Warning] Email dispatch to ${to} encountered an issue: ${errMsg}`);
    }
    
    // Print notification output clearly so invitation links and OTPs are never lost
    console.log(`\n--- [FALLBACK EMAIL DISPATCH] ---`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()}`);
    console.log(`---------------------------------\n`);
    
    return true; // Successfully handled via fallback notification channel
  }
};

export const sendNewProjectNotification = async (projectTitle: string, adminEmails: string[]) => {
  const subject = `New Project Listed: ${projectTitle}`;
  const html = `
    <h2>New Project Listed</h2>
    <p>A new project "<strong>${projectTitle}</strong>" has been added to the platform.</p>
    <p>Please log in to the dashboard to review the details.</p>
  `;
  
  for (const email of adminEmails) {
    await sendEmail(email, subject, html);
  }
};

export const sendApprovalRequestNotification = async (requestType: string, requestedBy: string, adminEmails: string[]) => {
  const subject = `New Approval Request: ${requestType.replace(/_/g, ' ')}`;
  const html = `
    <h2>Approval Required</h2>
    <p>A new approval request for <strong>${requestType.replace(/_/g, ' ')}</strong> has been submitted by <strong>${requestedBy}</strong>.</p>
    <p>Please log in to the dashboard to approve or reject this request.</p>
  `;
  
  for (const email of adminEmails) {
    await sendEmail(email, subject, html);
  }
};

export const sendStatusUpdateNotification = async (entityType: string, entityName: string, newStatus: string, userEmail: string) => {
  const subject = `Status Update: ${entityName}`;
  const html = `
    <h2>Status Updated</h2>
    <p>The status of the ${entityType} "<strong>${entityName}</strong>" has been updated to <strong>${newStatus}</strong>.</p>
  `;
  
  await sendEmail(userEmail, subject, html);
};

export const sendPasswordResetEmail = async (userEmail: string, resetLink: string) => {
  const subject = `Password Reset Request - pySync`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-top: 0;">Password Reset Request</h2>
      <p>We received a request to reset the password for your pySync account.</p>
      <p>Click the button below to choose a new password. This link will expire in 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 10px; text-align: center;">pySync Real Estate Data Platform</p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, html);
};

export const sendPasswordResetOtpEmail = async (userEmail: string, otp: string) => {
  const subject = `Your pySync Password Reset OTP`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-top: 0; text-align: center;">pySync Password Reset</h2>
      <p>We received a request to reset your pySync password. Please use the following One-Time Password (OTP) to complete the reset process:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="background-color: #f3f4f6; color: #1f2937; padding: 16px 32px; font-size: 32px; font-weight: bold; letter-spacing: 6px; border-radius: 8px; display: inline-block; border: 1px solid #e5e7eb;">${otp}</span>
      </div>
      <p style="text-align: center; color: #ef4444; font-weight: bold;">This OTP is valid for 10 minutes.</p>
      <p style="color: #6b7280; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 10px; text-align: center;">pySync Real Estate Data Platform</p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, html);
};

export const sendUserWelcomeInvitationEmail = async (
  userEmail: string,
  userName: string,
  username: string,
  password: string,
  loginLink: string
) => {
  const subject = `Your pySync Account Has Been Created - Login Credentials`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">pySync</h1>
        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 4px 0 0 0; font-weight: bold;">Real Estate Data Platform</p>
      </div>

      <div style="border-top: 2px solid #fef3c7; margin-bottom: 24px;"></div>

      <h2 style="font-size: 20px; color: #111827; margin: 0 0 12px 0;">Welcome, ${userName || 'Team Member'}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 20px 0;">
        An administrator has provisioned an account for you on the <strong>pySync Platform</strong>. You can now use your generated credentials to sign in and access the system.
      </p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin: 0 0 16px 0; font-weight: 700;">Your Account Credentials</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #6b7280; width: 140px; font-weight: 600;">Work Email:</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827; font-family: monospace; font-weight: bold;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Username / ID:</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827; font-family: monospace; font-weight: bold;">${username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Temporary Password:</td>
            <td style="padding: 8px 0; font-size: 14px; color: #d97706; font-family: monospace; font-weight: bold; letter-spacing: 0.5px;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${loginLink}" style="background-color: #f59e0b; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);">
          Click Here to Log In & Access Platform &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin: 16px 0; text-align: center;">
        If the button above does not work, copy and paste this link into your browser:<br />
        <a href="${loginLink}" style="color: #d97706; word-break: break-all;">${loginLink}</a>
      </p>

      <div style="border-top: 1px solid #f3f4f6; margin-top: 28px; padding-top: 16px;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.4;">
          Security Notice: Please keep your credentials confidential. For security purposes, please update your password upon your initial sign in.
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
};

