/** Shared ranking recomputation (mirrors POST /api/admin/recalculate). */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

const REGIONS = ["North America", "Europe", "Asia", "Africa", "South America", "Oceania"];

export async function recomputeRankings(db: Firestore): Promise<{ ranked: number; approved: number }> {
  const snap = await db.collection("universities").where("status", "==", "approved").get();
  const unis = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as {
    id: string; name: string; country: string; region: string; score: number | null;
    pillarScores: Record<string, number> | null;
  }[];

  const scored = unis
    .filter((u) => typeof u.score === "number")
    .sort((a, b) => (b.score as number) - (a.score as number));

  const assessSnap = await db.collection("assessments").count().get();
  const avg = (arr: number[]): number | null =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const regionAvgs: Record<string, { count: number; avgScore: number | null }> = {};
  for (const r of REGIONS) {
    const inRegion = unis.filter((u) => u.region === r);
    regionAvgs[r] = {
      count: inRegion.length,
      avgScore: avg(inRegion.filter((u) => typeof u.score === "number").map((u) => u.score as number)),
    };
  }

  await db.doc("stats/singleton").set(
    {
      totalUniversities: unis.length,
      totalAssessments: assessSnap.data().count,
      avgScore: avg(scored.map((u) => u.score as number)),
      topUniversities: scored.slice(0, 100).map((u, i) => ({
        rank: i + 1, id: u.id, name: u.name, country: u.country, score: u.score,
        pillarScores: u.pillarScores ?? null,
      })),
      regionAvgs,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  for (const region of ["global", ...REGIONS]) {
    const list = (region === "global" ? scored : scored.filter((u) => u.region === region)).slice(0, 100);
    await db.doc(`rankings/${region}`).set(
      {
        region,
        list: list.map((u, i) => ({ rank: i + 1, id: u.id, name: u.name, country: u.country, score: u.score, pillarScores: u.pillarScores ?? null })),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return { ranked: scored.length, approved: unis.length };
}
