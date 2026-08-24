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
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465 ? true : env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    lookup: createLookup(),
    tls: {
      rejectUnauthorized: env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
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
  const invitationUrl = `${env.BASE_URL}/accept-invitation?token=${token}`;
  const displayName = name || 'User';

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject: 'You are invited to join Wholesale Distribution',
    text: `Hello ${displayName},\n\nYou have been invited to join Wholesale Distribution.\n\nPlease use the link below to set up your username and password:\n${invitationUrl}\n\nThis link will expire in 7 days.\n\nRegards,\nWholesale Distribution`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello ${displayName},</p>
        <p>You have been invited to join Wholesale Distribution.</p>
        <p>Please use the link below to set up your username and password:</p>
        <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 16px 0;">Accept Invitation</a>
        <p style="color: #666; font-size: 14px;">This link will expire in 7 days. If you didn't expect this invitation, please ignore this email.</p>
        <p>Regards,<br>Wholesale Distribution</p>
      </div>
    `,
  };

  const currentTransporter = await getTransporter();
  try {
    await currentTransporter.sendMail(mailOptions);
    logger.info({ to }, 'Invitation email sent');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send invitation email');
    throw error;
  }
}
