import nodemailer from 'nodemailer';
import dns from 'dns';
import { env } from './env.js';
import { logger } from './logger.js';

function createLookup() {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, family: 4 }, callback);
  };
}

let transporter;

async function createTransporter() {
  const isGmail =
    env.SMTP_HOST === 'smtp.gmail.com' ||
    (env.SMTP_USER && env.SMTP_USER.toLowerCase().includes('@gmail.com'));

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465 ? true : Boolean(env.SMTP_SECURE),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    lookup: createLookup(),
    tls: {
      rejectUnauthorized: env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });
}

export async function getTransporter() {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
}

export async function sendResetPasswordEmail(to, token, name) {
  const resetUrl = `${env.BASE_URL}/reset-password?token=${token}`;
  const displayName = name || 'User';

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject: 'Password Reset Request',
    text: `Hello ${displayName},\n\nWelcome to Wholesale Distribution.\n\nPlease use the reset link below to reset your password:\n${resetUrl}\n\nRegards,\nWholesale Distribution`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello ${displayName},</p>
        <p>Welcome to Wholesale Distribution.</p>
        <p>Please use the reset link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <p>Regards,<br>Wholesale Distribution</p>
      </div>
    `,
  };

  const currentTransporter = await getTransporter();
  try {
    await currentTransporter.sendMail(mailOptions);
    logger.info({ to }, 'Password reset email sent');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send password reset email');
    throw error;
  }
}

export async function sendInvitationEmail(to, token, name) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const invitationUrl = `${frontendUrl}/accept-invitation?token=${token}`;
  const displayName = name || 'User';

  console.log('\n======================================================');
  console.log(`[INVITATION EMAIL] Recipient: ${to} (${displayName})`);
  console.log(`[INVITATION LINK]: ${invitationUrl}`);
  console.log('======================================================\n');

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject: 'You are invited to join Wholesale Distribution',
    text: `Hello ${displayName},\n\nYou have been invited to join Wholesale Distribution.\n\nPlease use the link below to set up your username and password:\n${invitationUrl}\n\nThis link will expire in 7 days.\n\nRegards,\nWholesale Distribution`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${displayName}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">You have been invited to join the Wholesale Distribution System team.</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Click the button below to set up your username and password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);">Set Up Account</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Or copy and paste this link into your browser:<br><a href="${invitationUrl}" style="color: #3b82f6;">${invitationUrl}</a></p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;">This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    `,
  };

  const currentTransporter = await getTransporter();
  try {
    await currentTransporter.sendMail(mailOptions);
    logger.info({ to }, 'Invitation email sent');
  } catch (error) {
    logger.error({ error: error.message, to }, 'Failed to send invitation email via SMTP (invitation link logged to console)');
    // Don't re-throw in development if SMTP is not configured
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
