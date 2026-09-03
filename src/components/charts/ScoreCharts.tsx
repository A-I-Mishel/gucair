'use client';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { PillarScores } from "@/types";
import { PILLARS } from "@/types";

export function PillarRadar({ scores, name }: { scores: PillarScores; name?: string }) {
  const data = PILLARS.map((p) => ({ pillar: p.label, value: scores[p.key] ?? 0 }));
  return (
    <div role="img" aria-label={`Radar chart of pillar scores${name ? ` for ${name}` : ""}`}>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11 }} />
          <Radar dataKey="value" stroke="#1e3a5f" fill="#2dd4bf" fillOpacity={0.5} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PillarBars({ scores }: { scores: PillarScores }) {
  const data = PILLARS.map((p) => ({ name: p.key, score: scores[p.key] ?? 0, full: p.label }));
  return (
    <div role="img" aria-label="Bar chart of pillar scores">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="score" fill="#1e3a5f" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLine({ points }: { points: { version: number; score: number }[] }) {
  return (
    <div role="img" aria-label="Line chart of score trend">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="version" label={{ value: "Version", position: "insideBottom", offset: -2 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#2dd4bf" strokeWidth={2} dot={{ fill: "#1e3a5f" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div role="img" aria-label={`Overall score ${score} out of 100`} className="inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="70" textAnchor="middle" dy="8" fontSize="26" fontWeight="700" fill="#1e3a5f">
          {score}
        </text>
      </svg>
    </div>
  );
}
