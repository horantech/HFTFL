import twilio from "twilio";
import { EVENT } from "./event";

// Twilio transport.
//
// Required env:
//   TWILIO_ACCOUNT_SID    Account SID from twilio.com/console
//   TWILIO_AUTH_TOKEN     Auth token from twilio.com/console
//   TWILIO_FROM           A Twilio phone number or alphanumeric Sender ID

let client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  client = twilio(sid, token);
  return client;
}

function ticketUrl(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://hftf.vercel.app";
  return `${base.replace(/\/$/, "")}/t/${code}`;
}

function tableLine(tableNumber?: string | null) {
  const t = tableNumber?.trim();
  return t ? ` Table ${t}.` : "";
}

// Kept under 160 GSM-7 chars so each send fits in 1 SMS segment. Em-dash and
// curly quotes are intentionally avoided — they force UCS-2 encoding (70-char
// ceiling) and would balloon a single message to 2-3 segments.
export function buildReminderMessage(opts: { name: string; code: string; tableNumber?: string | null }) {
  const url = ticketUrl(opts.code);
  return (
    `Dear ${opts.name},\n` +
    `Reminder: HFTF Dinner is Today at ${EVENT.time}, ${EVENT.venue}.${tableLine(opts.tableNumber)} QR: ${url}`
  );
}

export type SmsResult = { ok: true; sid: string } | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const c = getClient();
  if (!c) return { ok: false, error: "Twilio not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)" };
  const from = process.env.TWILIO_FROM;
  if (!from) return { ok: false, error: "TWILIO_FROM not set" };
  try {
    const msg = await c.messages.create({ to, from, body });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM,
  );
}
