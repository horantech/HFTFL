import NewSponsorForm from "./NewSponsorForm";

export const metadata = { title: "New sponsor · HFTF" };

export default function NewSponsorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Add a buyer</div>
        <h1 className="font-display text-3xl">New sponsor</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          A sponsor is the person or company who is buying tickets — a company, a CEO, or an individual.
        </p>
      </div>
      <NewSponsorForm />
    </div>
  );
}
