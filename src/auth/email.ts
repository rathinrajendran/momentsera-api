import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection established");
  } catch (error) {
    console.error("❌ SMTP connection failed:", error);
    throw error;
  }
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? '"Momentsera" <noreply@momentsera.com>',
    to,
    subject,
    html,
  });

  console.log("📧 Email sent:", info.messageId);

  return info;
}
