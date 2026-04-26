import Scanner from "./Scanner";

export const metadata = { title: "Scan tickets · HFTF" };

export default function ScanPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Scan tickets</h1>
        <p className="text-sm text-[var(--ink-mute)] mt-0.5">
          Point the camera at a guest&apos;s QR code. The system marks them checked-in instantly.
        </p>
      </div>
      <Scanner/>
    </div>
  );
}
