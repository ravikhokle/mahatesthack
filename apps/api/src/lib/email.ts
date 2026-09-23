import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';

import { env } from '../config/env.js';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult = {
  delivered: boolean;
  provider: 'smtp' | 'resend' | 'console';
  messageId?: string;
  error?: string;
};

function getSmtpTransporter(): Transporter | null {
  if (env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: env.SMTP_SERVICE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }

  return null;
}

const smtpTransporter = getSmtpTransporter();
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  // 1. Try SMTP if configured (Gmail, Brevo, AWS SES, custom SMTP)
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      console.info(`[email:smtp] Delivered to ${input.to} (Message ID: ${info.messageId})`);
      return { delivered: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error(`[email:smtp] Delivery failed to ${input.to}:`, err.message);
      if (!resend && env.NODE_ENV !== 'development') {
        throw err;
      }
    }
  }

  // 2. Try Resend if configured
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });

      if (result.error) {
        const errorMsg = result.error.message;
        const isSandboxError =
          errorMsg.includes('only send testing emails to your own email address') ||
          result.error.statusCode === 403;

        if (isSandboxError) {
          console.warn(
            `[email:resend-sandbox] Resend test domain (${env.EMAIL_FROM}) only sends to account owner email.`,
          );
          console.warn(`[email:resend-sandbox] Detail: ${errorMsg}`);
        } else {
          console.warn(`[email:resend] Send error: ${errorMsg}`);
        }

        if (env.NODE_ENV === 'development') {
          return { delivered: false, provider: 'resend', error: errorMsg };
        }

        throw new Error(errorMsg);
      }

      console.info(`[email:resend] Delivered to ${input.to} (ID: ${result.data?.id})`);
      return { delivered: true, provider: 'resend', messageId: result.data?.id };
    } catch (err: any) {
      if (env.NODE_ENV === 'development') {
        console.warn(`[email:resend] Exception: ${err.message}`);
        return { delivered: false, provider: 'resend', error: err.message };
      }
      throw err;
    }
  }

  // 3. Fallback: Local console
  console.info('[email:console]', {
    to: input.to,
    subject: input.subject,
  });
  return { delivered: false, provider: 'console' };
}

export function verificationEmailHtml(name: string, otp: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827">Verify your email</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Hi ${name}, use the code below to verify your ${env.APP_NAME} account.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;letter-spacing:.05em;text-transform:uppercase">Your verification code</p>
        <p style="margin:0;font-size:44px;font-weight:700;letter-spacing:12px;color:#111827;font-family:monospace">${otp}</p>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af">⏱ This code expires in <strong>10 minutes</strong>.</p>
      <p style="margin:0;font-size:13px;color:#9ca3af">If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;
}

export function resetPasswordEmailHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827">Reset your password</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Hi ${name}, click the link below to reset your ${env.APP_NAME} password.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">Reset password</a>
      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
}
