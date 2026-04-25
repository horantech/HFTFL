import Scanner from "./Scanner";

export const metadata = { title: "Scan tickets · HFTF" };

export default function ScanPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Entrance</div>
        <h1 className="font-display text-3xl">Scan tickets</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Point the camera at a guest&apos;s QR code. The system marks them checked-in instantly.
        </p>
      </div>
      <Scanner/>
    </div>
  );
}
