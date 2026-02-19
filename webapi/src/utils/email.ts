import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getConfig } from "../config/index.ts";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["app", "email"]);

let transporter: Transporter | null = null;

/**
 * Checks if SMTP is configured and available.
 */
export function isSmtpConfigured(): boolean {
  const config = getConfig();
  return !!(config.SMTP_HOST && config.SMTP_PORT && config.SMTP_FROM);
}

/**
 * Gets or creates the nodemailer transporter.
 * Returns null if SMTP is not configured.
 */
function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  const config = getConfig();

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth:
      config.SMTP_USER && config.SMTP_PASS
        ? {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          }
        : undefined,
  });

  return transporter;
}

/**
 * Sends a password reset email to the user.
 * @param email - User's email address
 * @param token - Plain reset token (will be included in URL)
 * @returns true if email was sent, false if SMTP not configured or send failed
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    logger.warn(
      "SMTP not configured, skipping password reset email to {email}",
      { email }
    );
    return false;
  }

  const config = getConfig();
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await transport.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject: "Reset Your Password - Volunteer Hub",
      text: `
You requested a password reset for your Volunteer Hub account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">Reset Your Password</h2>
    <p>You requested a password reset for your Volunteer Hub account.</p>
    <p>Click the button below to reset your password:</p>
    <p style="margin: 30px 0;">
      <a href="${resetUrl}"
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">
      If you did not request this password reset, please ignore this email.
    </p>
  </div>
</body>
</html>
      `.trim(),
    });

    logger.info("Password reset email sent to {email}", { email });
    return true;
  } catch (err) {
    logger.error("Failed to send password reset email to {email}: {error}", {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
