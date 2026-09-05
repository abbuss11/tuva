type CertificateNotification = {
  fullName: string;
  email: string | null;
  phone: string | null;
  certificateNumber: string;
  certificateUrl: string;
};

type NotificationResult = {
  email: "sent" | "skipped" | "failed";
  sms: "sent" | "skipped" | "failed";
};

function messageFor(data: CertificateNotification): string {
  return `Bonjour ${data.fullName}, votre attestation ${data.certificateNumber} est disponible : ${data.certificateUrl}`;
}

async function sendEmail(data: CertificateNotification): Promise<NotificationResult["email"]> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from || !data.email) return "skipped";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [data.email],
      subject: `Votre attestation ${data.certificateNumber}`,
      text: messageFor(data),
      html: `<p>Bonjour ${data.fullName},</p><p>Votre attestation est disponible.</p><p><a href="${data.certificateUrl}">Télécharger l'attestation PDF</a></p>`,
    }),
  });

  return response.ok ? "sent" : "failed";
}

async function sendSms(data: CertificateNotification): Promise<NotificationResult["sms"]> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from || !data.phone) return "skipped";

  const body = new URLSearchParams({
    From: from,
    To: data.phone,
    Body: messageFor(data),
  });
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  return response.ok ? "sent" : "failed";
}

export async function notifyCertificate(
  data: CertificateNotification,
): Promise<NotificationResult> {
  const [email, sms] = await Promise.all([
    sendEmail(data).catch(() => "failed" as const),
    sendSms(data).catch(() => "failed" as const),
  ]);
  return { email, sms };
}