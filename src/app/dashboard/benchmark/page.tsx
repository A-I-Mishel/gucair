'use client';
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUniversities } from "@/hooks/useUniversities";
import { PillarRadar } from "@/components/charts/ScoreCharts";
import { Button } from "@/components/ui/button";
import { generateReportPDF } from "@/lib/pdf-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BenchmarkPage() {
  const { data } = useUniversities(100);
  const [selected, setSelected] = useState<string[]>([]);

  const peers = useMemo(() => (data ?? []).filter((u) => selected.includes(u.id)), [data, selected]);
  const scored = useMemo(
    () => (data ?? []).filter((u) => u.score != null && u.pillarScores != null),
    [data]
  );

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(0, 5)));
  };

  const radarData = peers[0]?.pillarScores;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Peer benchmarking</h1>
      <p className="text-sm text-slate-600">Select 3–5 peer universities to compare pillar scores. Only assessed universities appear.</p>
      <div className="grid max-h-64 gap-1 overflow-y-auto rounded-xl border p-3">
        {scored.map((u) => (
          <label key={u.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
            {u.name} — {u.country} ({u.score})
          </label>
        ))}
        {scored.length === 0 && <p className="text-sm text-slate-500">No assessed universities yet.</p>}
      </div>
      <div id="report-content" className="bg-white p-4 sm:p-8">
        <h2 className="text-xl font-bold">GUCAIR Benchmark Report</h2>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString()} · {peers.length} universities</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-slate-500"><th className="py-2">University</th><th>Overall</th><th>Research</th><th>Curriculum</th><th>Infrastructure</th><th>Ethics</th><th>Industry</th></tr></thead>
            <tbody>
              {peers.map((p) => (
                <tr key={p.id} className="border-t"><td className="py-2 font-medium">{p.name}</td><td>{p.score ?? "—"}</td><td>{p.pillarScores?.research ?? "—"}</td><td>{p.pillarScores?.curriculum ?? "—"}</td><td>{p.pillarScores?.infrastructure ?? "—"}</td><td>{p.pillarScores?.ethics ?? "—"}</td><td>{p.pillarScores?.industry ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {radarData && (
          <Card className="mt-4"><CardHeader><CardTitle>Pillar radar — {peers[0].name}</CardTitle></CardHeader>
          <CardContent><PillarRadar scores={radarData} name={peers[0].name} /></CardContent></Card>
        )}
        {peers.length > 0 && (
          <Card className="mt-4"><CardHeader><CardTitle>Overall score comparison</CardTitle></CardHeader>
          <CardContent>
            <div role="img" aria-label="Bar chart comparing overall scores">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={peers.map((p) => ({ name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name, score: p.score ?? 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>
        )}
      </div>
      <Button variant="accent" onClick={() => generateReportPDF("report-content", "gucair-benchmark-report")}>
        Download PDF
      </Button>
    </div>
  );
}
