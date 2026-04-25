"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Undo2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  ticketCode: string;
  checkedInAt: Date | null;
  sponsorId: string;
  sponsorName: string;
};

export default function GuestSearchRow({ g }: { g: Row }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function checkin() {
    setBusy(true);
    await fetch(`/api/guests/${g.id}/checkin`, { method: "POST" });
    router.refresh();
    setBusy(false);
  }
  async function uncheck() {
    setBusy(true);
    await fetch(`/api/guests/${g.id}/checkin`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <tr>
      <td className="font-medium">{g.name}</td>
      <td>
        <Link href={`/sponsors/${g.sponsorId}`} className="text-[var(--ink-soft)] hover:underline">{g.sponsorName}</Link>
      </td>
      <td className="text-[var(--ink-soft)]">{g.phone || "—"}</td>
      <td>
        {g.checkedInAt
          ? <span className="badge badge-success">In · {formatTime(g.checkedInAt)}</span>
          : <span className="badge badge-muted">Pending</span>}
      </td>
      <td className="text-right">
        {g.checkedInAt ? (
          <button onClick={uncheck} disabled={busy} className="btn btn-ghost text-sm text-red-700">
            <Undo2 size={14}/> Undo
          </button>
        ) : (
          <button onClick={checkin} disabled={busy} className="btn btn-primary text-sm">
            <Check size={14}/> Check in
          </button>
        )}
      </td>
    </tr>
  );
}
