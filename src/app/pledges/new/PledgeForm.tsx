"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function PledgeForm() {
  const [name, setName] = useState("");
  // Start with prefix but allow editing/validation
  const [phone, setPhone] = useState("251"); 
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; amount: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    const cleanedAmount = parseInt(amount, 10);
    
    // Validation
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!phone.trim() || phone.length < 9) { 
      setError("Please enter a valid phone number."); 
      return; 
    }
    if (!Number.isFinite(cleanedAmount) || cleanedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/pledges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          amount: cleanedAmount,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Could not save your pledge. Please try again.");
        return;
      }
      setDone({ name: name.trim(), amount: cleanedAmount });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center space-y-3 py-8">
        <div className="mx-auto inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-100">
          <CheckCircle2 size={32} className="text-green-700" />
        </div>
        <div className="text-xl font-semibold">Thank you, {done.name}!</div>
        <div className="text-sm text-[var(--ink-mute)]">
          Your pledge of <strong className="text-[var(--ink)]">{formatBirr(done.amount)}</strong> has been recorded.
        </div>
        <button
          onClick={() => {
            setDone(null);
            setName("");
            setPhone("251");
            setAmount("");
          }}
          className="btn btn-outline btn-sm mt-2"
        >
          Submit another pledge
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="text-sm font-semibold">Record your pledge</div>
      
      <div>
        <label className="label">Full name</label>
        <input
          className="input"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Almaz Tesfaye"
        />
      </div>

      <div>
        <label className="label">Phone Number</label>
        <input
          className="input"
          required
          type="tel"
          value={phone}
          // Only allow digits
          onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="2519..."
        />
      </div>

      <div>
        <label className="label">Amount (ETB)</label>
        <input
          className="input"
          required
          inputMode="numeric"
          value={amount}
          // Only allow digits
          onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
          placeholder="e.g. 5000"
        />
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">
          {error}
        </div>
      )}

      <button
        className="btn btn-primary btn-lg w-full"
        disabled={busy || !name.trim() || !phone.trim() || !amount.trim()}
      >
        {busy ? "Submitting…" : "Submit pledge"}
      </button>
    </form>
  );
}

function formatBirr(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} ETB`;
}