'use client';
import Link from "next/link";
import type { RankingEntry } from "@/types";

const PILLARS: { key: "research" | "curriculum" | "infrastructure" | "ethics" | "industry"; short: string }[] = [
  { key: "research", short: "Res" },
  { key: "curriculum", short: "Cur" },
  { key: "infrastructure", short: "Inf" },
  { key: "ethics", short: "Eth" },
  { key: "industry", short: "Ind" },
];

export function RankingTable({ rows }: { rows: RankingEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">University</th>
            <th className="px-4 py-3">Country</th>
            <th className="px-4 py-3">Score</th>
            {PILLARS.map((p) => (
              <th key={p.key} className="px-4 py-3" title={p.key}>{p.short}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-bold">#{r.rank}</td>
              <td className="px-4 py-3">
                <Link href={`/universities/${r.id}`} className="text-[#1e3a5f] hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="px-4 py-3">{r.country}</td>
              <td className="px-4 py-3 font-semibold">{r.score}</td>
              {PILLARS.map((p) => (
                <td key={p.key} className="px-4 py-3">{r.pillarScores?.[p.key] ?? "—"}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                No assessed universities yet. Rankings list only universities with a validated
                assessment score — all current members are awaiting their first assessment.
                Browse the <a href="/universities" className="text-teal-700 hover:underline">directory</a> to
                see all members.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
