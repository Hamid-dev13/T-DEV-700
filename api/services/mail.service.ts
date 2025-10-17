import nodemailer from "nodemailer";
import { generatePasswordResetToken } from "./password.service";

export let transporter: nodemailer.Transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_USE_SSL!.toLowerCase() == "true" || process.env.SMTP_USE_SSL! == "1",
    auth: {
      user: process.env.SMTP_USERNAME!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });
  console.log("Mail service configured");
} catch (err: any) {
  console.log("Error configuring mailer: %s\nThe mail service will not be available.", err instanceof Error ? err.message : err);
}

export async function sendPasswordResetToken(email: string) {
  const token = await generatePasswordResetToken(email);

  await sendMail(email,
    "Time Manager - Password Reset Request",
    `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n${process.env.WEBSITE_URL}/reset-password?token=${token}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nTime Manager Team`
  );
}

export async function sendMail(to: string, subject: string, body: string, bodyHtml?: string) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject,
    text: body,
    html: bodyHtml ? bodyHtml : `<p>${body}</p>`
  }, (err, info) => {
    console.log("info: %s\nerr:", info, err);

    if (err)
      throw new Error("Error when sending mail");
  });
}