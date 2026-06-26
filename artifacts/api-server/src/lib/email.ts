import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env["EMAIL_USER"];
  const pass = process.env["EMAIL_APP_PASSWORD"];
  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_APP_PASSWORD environment variables must be set for email sending.",
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendTempPin(toEmail: string, pin: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env["EMAIL_USER"],
    to: toEmail,
    subject: "KVF Learning Tracker - Temporary PIN",
    text: `Your temporary login PIN is ${pin}.\nThis PIN expires in 10 minutes.`,
  });
}
