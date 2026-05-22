import nodemailer from 'nodemailer';

// Configure the email transport
// For production, use real SMTP credentials. For development, we can use Ethereal or just log.
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('SMTP credentials not fully provided. Email service will run in MOCK mode (logging to console).');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user, pass },
    // Add timeout to avoid hanging
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
};

let transporter = getTransporter();

export const sendEmail = async (to: string, subject: string, html: string) => {
  const from = process.env.EMAIL_FROM || '"pySync Notifications" <noreply@pysync.local>';
  
  if (!transporter) {
    console.log(`\n--- [MOCK EMAIL] ---`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${html.substring(0, 100)}...`);
    console.log(`--------------------\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    
    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error.message);
    
    if (error.message.includes('535') || error.message.includes('Authentication failed')) {
      console.error('CRITICAL: SMTP Authentication failed. Please check your SMTP_USER and SMTP_PASS in the Settings menu.');
      console.error('Falling back to MOCK mode for this session.');
      transporter = null; // Fallback to mock for subsequent calls
    }
    
    return false;
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
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
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
