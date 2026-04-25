"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, Send } from "lucide-react";

type SponsorOpt = { id: string; name: string; isIndividual: boolean };

export default function ImportForm({ sponsors }: { sponsors: SponsorOpt[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">(sponsors.length > 0 ? "existing" : "new");
  const [sponsorId, setSponsorId] = useState<string>(sponsors[0]?.id || "");
  const [newSponsorName, setNewSponsorName] = useState("");
  const [individualEach, setIndividualEach] = useState(false);
  const [rows, setRows] = useState<Record<string,string>[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function parseFile(file: File) {
    setFilename(file.name);
    Papa.parse<Record<string,string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase(),
      complete: (res: Papa.ParseResult<Record<string,string>>) => {
        setRows(res.data.filter((r) => Object.values(r).some(v => v && String(v).trim())));
        setError(null);
      },
      error: (e: Error) => setError(e.message),
    });
  }

  async function submit() {
    if (!rows || rows.length === 0) { setError("No rows to import"); return; }
    if (mode === "existing" && !sponsorId) { setError("Choose a sponsor"); return; }
    if (mode === "new" && !newSponsorName.trim() && !individualEach) { setError("Enter a sponsor name"); return; }

    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: individualEach ? "individuals" : mode,
          sponsorId: mode === "existing" ? sponsorId : undefined,
          newSponsorName: mode === "new" ? newSponsorName : undefined,
          rows,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Import failed"); return; }
      setResult(`Imported ${j.created} guest${j.created === 1 ? "" : "s"}${j.sponsorCreated ? ` and created sponsor "${j.sponsorCreated}"` : ""}.`);
      setRows(null);
      setFilename("");
      router.refresh();
    } catch { setError("Network error"); }
    finally { setBusy(false); }
  }

  const preview = rows?.slice(0, 5) || [];
  const headers = preview[0] ? Object.keys(preview[0]) : [];

  return (
    <div className="card space-y-5">
      <div>
        <label className="label">CSV file</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-green)] file:text-white file:px-4 file:py-2 file:font-medium hover:file:bg-[var(--brand-green-dark)]"
        />
        {filename && <div className="text-xs text-[var(--ink-soft)] mt-1">{filename} · {rows?.length ?? 0} rows</div>}
      </div>

      <div>
        <label className="label">Group these guests under</label>
        <div className="flex flex-col gap-2 text-sm">
          {sponsors.length > 0 && (
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "existing" && !individualEach} onChange={() => { setMode("existing"); setIndividualEach(false); }}/>
              <span>An existing sponsor</span>
              {mode === "existing" && !individualEach && (
                <select className="input ml-2 w-auto" value={sponsorId} onChange={e=>setSponsorId(e.target.value)}>
                  {sponsors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}{s.isIndividual ? " (individual)" : ""}</option>
                  ))}
                </select>
              )}
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "new" && !individualEach} onChange={() => { setMode("new"); setIndividualEach(false); }}/>
            <span>A new sponsor named</span>
            {mode === "new" && !individualEach && (
              <input className="input ml-2 w-auto" value={newSponsorName} onChange={e=>setNewSponsorName(e.target.value)} placeholder="Company name"/>
            )}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={individualEach} onChange={() => setIndividualEach(true)}/>
            <span>Each row is an <strong>individual</strong> buyer (one sponsor per row, named after the guest)</span>
          </label>
        </div>
      </div>

      {preview.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-1">Preview · first 5 rows</div>
          <div className="overflow-auto border border-[var(--brand-line)] rounded-md">
            <table className="table">
              <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>{headers.map(h => <td key={h}>{r[h]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">{error}</div>}
      {result && <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2.5">{result}</div>}

      <div className="flex justify-end">
        <button onClick={submit} disabled={!rows || busy} className="btn btn-primary">
          {busy ? <><Send size={16}/> Importing…</> : <><Upload size={16}/> Import {rows?.length || 0} rows</>}
        </button>
      </div>
    </div>
  );
}
