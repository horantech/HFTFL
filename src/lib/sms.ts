import { EVENT } from "./event";

// AfroMessage transport.
//
// Required env:
//   AFROMESSAGE_API_KEY   The Bearer token from your token dashboard (Tokens → API KEY).
// Optional env:
//   AFROMESSAGE_FROM      The identifier id (Identifiers menu) — left blank uses the
//                         default identifier set on the account.
//   AFROMESSAGE_SENDER    Display sender name (must be a verified Sender ID, e.g., "HFTF").
//                         Left blank uses the identifier's default sender (e.g., "Qsms").

function ticketUrl(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://hftf.vercel.app";
  return `${base.replace(/\/$/, "")}/t/${code}`;
}

function tableLine(tableNumber?: string | null) {
  const t = tableNumber?.trim();
  return t ? ` Your table: ${t}.` : "";
}

export function buildReminderMessage(opts: { name: string; code: string; tableNumber?: string | null }) {
  const url = ticketUrl(opts.code);
  return (
    `Reminder: ${EVENT.name} is on ${EVENT.date} at ${EVENT.time}, ${EVENT.venue}.${tableLine(opts.tableNumber)} ` +
    `Hello ${opts.name} — your entry QR: ${url}`
  );
}

export type SmsResult = { ok: true; sid: string } | { ok: false; error: string };

type AfroResponse = {
  acknowledge?: "success" | "error";
  response?: {
    message_id?: string;
    id?: string;
    messageId?: string;
    message?: string;
    [key: string]: unknown;
  } | string;
};

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  // Strip whitespace/newlines that often sneak in when copy-pasting JWTs.
  const apiKey = process.env.AFROMESSAGE_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) return { ok: false, error: "AFROMESSAGE_API_KEY not set" };

  // A JWT has exactly 2 dots (header.payload.signature). If the value in .env
  // has more or fewer, the most common cause is truncation artifacts ("...") or
  // line breaks copied from the AfroMessage dashboard cell.
  const dots = (apiKey.match(/\./g) || []).length;
  if (dots !== 2) {
    return {
      ok: false,
      error:
        `AFROMESSAGE_API_KEY looks malformed (found ${dots} dots, expected 2). ` +
        `Re-copy the full JWT from the AfroMessage dashboard.`,
    };
  }

  const from = process.env.AFROMESSAGE_FROM?.trim() || undefined;
  const sender = process.env.AFROMESSAGE_SENDER?.trim() || undefined;

  try {
    const res = await fetch("https://api.afromessage.com/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        message: body,
        ...(from ? { from } : {}),
        ...(sender ? { sender } : {}),
      }),
    });

    const rawText = await res.text();
    let json: AfroResponse | null = null;
    try { json = rawText ? (JSON.parse(rawText) as AfroResponse) : null; } catch { /* not JSON */ }

    if (!res.ok || !json || json.acknowledge !== "success") {
      const r = json?.response;
      const apiMsg =
        typeof r === "string" ? r :
        (r && typeof r === "object" && typeof r.message === "string") ? r.message :
        rawText || `HTTP ${res.status}`;
      return { ok: false, error: `AfroMessage [${res.status}]: ${apiMsg}` };
    }

    const r = json.response;
    const sid =
      (r && typeof r === "object" && (r.message_id || r.id || r.messageId)) || "";
    return { ok: true, sid: String(sid) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export function isSmsConfigured() {
  return Boolean(process.env.AFROMESSAGE_API_KEY);
}
