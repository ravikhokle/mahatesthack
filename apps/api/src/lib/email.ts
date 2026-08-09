import { Resend } from 'resend';

import { env } from '../config/env.js';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!resend) {
    console.info('[email:dev]', {
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return;
  }

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export function verificationEmailHtml(name: string, verifyUrl: string): string {
  return `
    <p>Hi ${name},</p>
    <p>Welcome to ${env.APP_NAME}. Please verify your email:</p>
    <p><a href="${verifyUrl}">Verify email</a></p>
    <p>If you did not create an account, ignore this email.</p>
  `;
}

export function resetPasswordEmailHtml(name: string, resetUrl: string): string {
  return `
    <p>Hi ${name},</p>
    <p>We received a request to reset your ${env.APP_NAME} password:</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If you did not request this, ignore this email.</p>
  `;
}
