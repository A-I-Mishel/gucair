'use client';
import { useMemo, useState } from "react";
import { useRankings } from "@/hooks/useRankings";
import { RankingTable } from "@/components/rankings/RankingTable";
import { Input } from "@/components/ui/primitives";
import { REGIONS } from "@/types";

const TABS = ["global", ...REGIONS];

export default function RankingsPage() {
  const [region, setRegion] = useState("global");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useRankings(region);
  const PER_PAGE = 20;

  const filtered = useMemo(() => {
    const r = data?.list ?? [];
    if (!q.trim()) return r;
    const needle = q.toLowerCase();
    return r.filter(
      (x) => x.name.toLowerCase().includes(needle) || x.country.toLowerCase().includes(needle)
    );
  }, [data, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">Rankings</h1>
      <p className="mt-2 text-slate-600">Pre-computed rankings — instant load, refreshed on every recalculation.</p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="note">
        Pilot phase: scores combine validated rep assessments with provisional admin estimates
        (labeled in each university&apos;s assessment history). Provisional rows are replaced
        automatically when reps submit verified assessments.
      </p>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Ranking regions">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={region === t}
            onClick={() => { setRegion(t); setPage(0); }}
            className={`rounded-full px-4 py-1.5 text-sm ${region === t ? "bg-[#1e3a5f] text-white" : "bg-slate-100 hover:bg-slate-200"}`}
          >
            {t === "global" ? "Global" : t}
          </button>
        ))}
      </div>
      <div className="mt-4 max-w-sm">
        <Input placeholder="Search university or country…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search rankings" />
      </div>
      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading rankings…</p>
        ) : (
          <>
            <RankingTable rows={rows} />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40" aria-label="Previous page">← Prev</button>
              <span aria-live="polite">Page {page + 1} of {pageCount} ({filtered.length} universities)</span>
              <button disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40" aria-label="Next page">Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
