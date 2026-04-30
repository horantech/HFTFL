import { CheckCircle2, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

type Props = {
  status: string | null | undefined;
  sentAt?: Date | null;
  error?: string | null;
  size?: "sm" | "xs";
};

// Renders a one-glance pill showing the most recent SMS reminder result for
// a guest. `null` status means no attempt yet — render nothing.
export default function SmsStatusBadge({ status, sentAt, error, size = "sm" }: Props) {
  if (!status) return null;
  const tiny = size === "xs";
  const iconSize = tiny ? 11 : 12;
  if (status === "sent") {
    const title = sentAt ? `SMS sent at ${formatTime(sentAt)}` : "SMS sent";
    return (
      <span className="badge badge-success" title={title}>
        <CheckCircle2 size={iconSize}/> SMS
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="badge bg-red-50 text-red-700 border-red-200" title={error || "SMS failed"}>
        <AlertCircle size={iconSize}/> SMS failed
      </span>
    );
  }
  return null;
}

// Aggregates per-guest SMS statuses into a single sponsor-level pill.
// Priority: failed > sent > none. `failed` shows when even one guest failed,
// because that's what staff need to act on.
type Aggregable = { smsLastStatus: string | null };
export function aggregateSmsStatus(rows: Aggregable[]): "sent" | "failed" | null {
  let anySent = false;
  for (const r of rows) {
    if (r.smsLastStatus === "failed") return "failed";
    if (r.smsLastStatus === "sent") anySent = true;
  }
  return anySent ? "sent" : null;
}
