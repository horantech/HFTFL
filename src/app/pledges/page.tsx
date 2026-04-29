import QRCode from "qrcode";
import LiveTotal from "./LiveTotal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pledges · Hope for the Fatherless" };

export default async function PledgesLandingPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://hftf.vercel.app";
  const formUrl = `${base.replace(/\/$/, "")}/pledges/new`;
  const qr = await QRCode.toDataURL(formUrl, {
    margin: 1,
    width: 600,
    color: { dark: "#1f3a1c", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen bg-[#1f3a1c] text-white flex flex-col">
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between">
        <div className="text-xs sm:text-sm tracking-[0.25em] uppercase text-white/70">
          Donation Dinner · April 30, 2026
        </div>
        <div className="text-xs sm:text-sm text-white/60 hidden sm:block">A Night of Hope</div>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 px-6 sm:px-10 pb-10 items-center">
        <div className="flex flex-col items-center justify-center">
          <LiveTotal />
        </div>

        <aside className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 max-w-sm mx-auto w-full">
          <div className="text-xs uppercase tracking-[0.25em] text-white/60">Scan to pledge</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={`QR code that links to ${formUrl}`}
            className="w-full max-w-[300px] aspect-square rounded-xl bg-white p-3"
          />
          <div className="text-center text-sm text-white/80 break-words">
            or visit{" "}
            <a href={formUrl} className="underline decoration-white/40 hover:decoration-white">
              {formUrl.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </aside>
      </main>

      <footer className="px-6 sm:px-10 py-4 text-center text-xs text-white/50">
        Hope for the Fatherless · Live pledge board
      </footer>
    </div>
  );
}
