import twilio from "twilio";
import { EVENT } from "./event";

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
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/t/${code}`;
}

export function buildGuestMessage(opts: { name: string; code: string }) {
  const url = ticketUrl(opts.code);
  return (
    `Dear ${opts.name}, you're invited to ${EVENT.name} on ${EVENT.date} at ${EVENT.time}, ${EVENT.venue}. ` +
    `Show this QR ticket at the door: ${url}`
  );
}

export function buildSponsorMessage(opts: { name: string; guestCount: number; firstCode?: string }) {
  const url = opts.firstCode ? ticketUrl(opts.firstCode) : null;
  const head = `Dear ${opts.name}, your ${opts.guestCount} guest${opts.guestCount === 1 ? "" : "s"} ` +
    `${opts.guestCount === 1 ? "is" : "are"} confirmed for ${EVENT.name} on ${EVENT.date} at ${EVENT.time}, ${EVENT.venue}.`;
  return url ? `${head} Your guests have received their QR tickets via SMS. Sample: ${url}` : head;
}

export function buildReminderMessage(opts: { name: string; code: string }) {
  const url = ticketUrl(opts.code);
  return (
    `Reminder: ${EVENT.name} is on ${EVENT.date} at ${EVENT.time}, ${EVENT.venue}. ` +
    `Hello ${opts.name} — your entry QR: ${url}`
  );
}

export type SmsResult = { ok: true; sid: string } | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const c = getClient();
  if (!c) return { ok: false, error: "Twilio not configured" };
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
