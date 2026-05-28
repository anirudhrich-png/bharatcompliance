import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. "+14155238886"

interface SendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  to: string, // 10-digit Indian mobile number
  message: string
): Promise<SendResult> {
  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "Twilio environment variables are not configured",
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:+91${to}`,
      body: message,
    });
    return { success: true, messageSid: msg.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    return { success: false, error: message };
  }
}

export function formatReminderMessage(
  name: string,
  filingType: string,
  dueDate: string,
  daysRemaining: number
): string {
  const formattedDate = new Date(dueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = name.split(" ")[0] ?? name;
  const urgencyLine =
    daysRemaining === 0
      ? "⚠️ Your filing is *due TODAY*. File immediately to avoid penalties."
      : daysRemaining < 0
      ? `⚠️ This filing is *${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? "s" : ""} overdue*. File now to minimise penalties.`
      : `*${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining.* File on time to avoid penalties.`;

  return (
    `🔔 *BharatCompliance Reminder*\n\n` +
    `Hi ${firstName}, your *${filingType}* filing is due on *${formattedDate}*.\n\n` +
    `${urgencyLine}\n\n` +
    `_— Team BharatCompliance_`
  );
}

export function formatTestMessage(name: string, phone: string): string {
  const firstName = name.split(" ")[0] ?? name;
  return (
    `✅ *BharatCompliance — Test Message*\n\n` +
    `Hi ${firstName}! Your WhatsApp number +91 ${phone} is correctly linked to BharatCompliance.\n\n` +
    `You will receive GST filing reminders here.\n\n` +
    `_— Team BharatCompliance_`
  );
}
