'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import { useStats } from "@/hooks/useGlobalStats";
import { useUniversities } from "@/hooks/useUniversities";
import { useRankings } from "@/hooks/useRankings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { WorldMap, ScoreLegend } from "@/components/map/WorldMap";
import { PILLARS } from "@/types";

export default function HomePage() {
  const { data: stats, isLoading: statsLoading, isError } = useStats();
  const { data: universities } = useUniversities(50);
  const { data: globalRanking } = useRankings("global");

  const top5 = globalRanking?.list?.slice(0, 5) ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a5f] via-[#24486f] to-[#0f766e] px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl"
          >
            Global University Consortium of AI Readiness
          </motion.h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">
            Universities worldwide assessing, benchmarking, and improving AI readiness across five
            core pillars — research, curriculum, infrastructure, ethics, and industry.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/rankings">
              <Button variant="accent" size="lg">Explore rankings</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="text-slate-900">Join the consortium</Button>
            </Link>
          </div>
          {/* Live stats */}
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-20 bg-white/20" />
                <Skeleton className="h-20 bg-white/20" />
                <Skeleton className="h-20 bg-white/20" />
                <Skeleton className="h-20 bg-white/20" />
              </>
            ) : (
              <>
                <Stat label="Universities" value={String(stats?.totalUniversities ?? "—")} />
                <Stat label="Assessments" value={String(stats?.totalAssessments ?? "—")} />
                <Stat label="Avg. global score" value={stats?.avgScore != null ? String(stats.avgScore) : "—"} />
                <Stat label="Regions" value="6" />
              </>
            )}
          </div>
          {isError && <p className="mt-4 text-sm text-amber-200">Live stats unavailable — connect Firebase to enable.</p>}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold text-[#1e3a5f]">Five-pillar framework</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {PILLARS.map((p) => (
            <Card key={p.key}>
              <CardContent className="p-5">
                <p className="text-3xl font-bold text-teal-500">{Math.round(p.weight * 100)}%</p>
                <p className="mt-1 font-semibold">{p.label}</p>
                <p className="mt-1 text-sm text-slate-500">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1e3a5f]">Member universities worldwide</h2>
          <Link href="/universities" className="text-sm text-teal-700 hover:underline">Directory →</Link>
        </div>
        <div className="mt-4 space-y-3">
          <ScoreLegend />
          {universities && universities.length > 0 ? (
            <WorldMap universities={universities} />
          ) : (
            <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
              Map activates once universities are approved in Firestore.
            </div>
          )}
        </div>
      </section>

      {/* Top 5 */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1e3a5f]">Top ranked universities</h2>
          <Link href="/rankings" className="text-sm text-teal-700 hover:underline">Full rankings →</Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {top5.length > 0 ? (
            top5.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-5">
                  <p className="text-xs font-bold text-teal-600">#{t.rank}</p>
                  <Link href={`/universities/${t.id}`} className="font-semibold text-[#1e3a5f] hover:underline">
                    {t.name}
                  </Link>
                  <p className="text-sm text-slate-500">{t.country}</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: "#1e3a5f" }}>{t.score}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-slate-500">Rankings will appear after the first validated assessments.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-slate-200">{label}</p>
    </div>
  );
}
