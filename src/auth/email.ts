import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({

  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525"),
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },

});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"App Support" <noreply@example.com>',
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
}
