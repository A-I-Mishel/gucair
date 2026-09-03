import { notFound } from "next/navigation";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { University, Assessment } from "@/types";
import { ScoreRing, PillarBars, TrendLine } from "@/components/charts/ScoreCharts";
import { UniAvatar } from "@/components/university/UniAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApprovedUniversityIds } from "@/lib/public-data";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getApprovedUniversityIds();
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export default async function UniversityProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await getDoc(doc(db, "universities", id)).catch(() => null);
  if (!snap || !snap.exists()) notFound();
  const data = { id: snap.id, ...snap.data() } as University;
  if (data.status !== "approved") notFound();
  const u = data;

  // Public trend: validated assessments only (publicly readable per rules).
  // A failure here must never 404 the whole profile.
  let trend: { version: number; score: number }[] = [];
  try {
    const aq = query(
      collection(db, "assessments"),
      where("universityId", "==", id),
      where("status", "==", "validated"),
      orderBy("version", "asc")
    );
    const asnap = await getDocs(aq);
    trend = asnap.docs.map((d) => {
      const a = d.data() as Assessment;
      return { version: a.version, score: a.overallScore };
    });
  } catch (e) {
    console.error(`Profile trend unavailable for ${id}:`, e instanceof Error ? e.message : e);
    trend = [];
  }
  const uni = u;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <div className="flex flex-wrap items-center gap-6">
        {uni.score != null ? (
          <ScoreRing score={uni.score} />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-slate-200 text-center text-sm text-slate-500" role="img" aria-label="Awaiting first assessment">
            Awaiting first assessment
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            {uni.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={uni.logoUrl} alt={`${uni.name} logo`} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <UniAvatar name={uni.name} size={56} />
            )}
            <h1 className="text-3xl font-bold text-[#1e3a5f]">{uni.name}</h1>
          </div>
          <p className="text-slate-600">{uni.city}, {uni.country} · {uni.region}</p>
          {uni.website && <a href={uni.website} target="_blank" rel="noreferrer" className="text-sm text-teal-700 hover:underline">{uni.website}</a>}
          <p className="mt-2 text-sm text-slate-500">
            {uni.type.replace("_", " ")}
            {uni.year != null && <> · Est. {uni.year}</>}
            {uni.studentCount != null && <> · {uni.studentCount.toLocaleString()} students</>}
            {uni.facultyCount != null && <> · {uni.facultyCount.toLocaleString()} faculty</>}
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Pillar breakdown</CardTitle></CardHeader><CardContent>
          {uni.pillarScores ? <PillarBars scores={uni.pillarScores} /> : <p className="text-sm text-slate-500">Awaiting first assessment.</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Assessment history</CardTitle></CardHeader><CardContent>
          {trend.length > 0 ? <TrendLine points={trend} /> : <p className="text-sm text-slate-500">No validated assessments yet.</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}
