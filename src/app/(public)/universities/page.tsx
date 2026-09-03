'use client';
import { useMemo, useState } from "react";
import { useUniversities } from "@/hooks/useUniversities";
import { UniversityCard } from "@/components/university/UniversityCard";
import { WorldMap, ScoreLegend } from "@/components/map/WorldMap";
import { Input } from "@/components/ui/primitives";
import { REGIONS } from "@/types";

export default function DirectoryPage() {
  const { data, isLoading } = useUniversities(200);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [view, setView] = useState<"grid" | "map">("grid");

  const filtered = useMemo(() => {
    return (data ?? []).filter((u) => {
      if (region !== "all" && u.region !== region) return false;
      if (search && !`${u.name} ${u.country} ${u.city}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search, region]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">University directory</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="space-y-4 rounded-xl border p-4" aria-label="Filters">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search universities" />
          <div>
            <p className="text-sm font-semibold">Region</p>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 w-full rounded-md border p-2 text-sm" aria-label="Filter by region">
              <option value="all">All regions</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView("grid")} className={`flex-1 rounded-md px-3 py-1.5 text-sm ${view === "grid" ? "bg-[#1e3a5f] text-white" : "bg-slate-100"}`}>Grid</button>
            <button onClick={() => setView("map")} className={`flex-1 rounded-md px-3 py-1.5 text-sm ${view === "map" ? "bg-[#1e3a5f] text-white" : "bg-slate-100"}`}>Map</button>
          </div>
          <ScoreLegend />
        </aside>
        <div>
          {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((u) => <UniversityCard key={u.id} u={u} />)}
              {filtered.length === 0 && <p className="text-sm text-slate-500">No universities match your filters.</p>}
            </div>
          ) : (
            <WorldMap universities={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}
