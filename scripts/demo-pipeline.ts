/**
 * DEMO end-to-end pipeline (local stand-in until assessments flow through the UI).
 * 1. Builds a DEMO assessment (clearly labeled) for a university from current questions.
 * 2. Scores it with the shared weighted algorithm.
 * 3. Validates it as admin.
 * 4. Recomputes stats + rankings via the shared recompute module.
 * Usage: npx tsx scripts/demo-pipeline.ts --universityId <id> [--ratio 0.6]
 * To remove demo data later: npx tsx scripts/cleanup-demo.ts --assessmentId <id>
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  }
}

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PILLAR_WEIGHTS: Record<string, number> = {
  research: 0.25,
  curriculum: 0.25,
  infrastructure: 0.2,
  ethics: 0.15,
  industry: 0.15,
};

async function main() {
  loadEnv();
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey,
      }),
    });
  }
  const db = getFirestore();
  const universityId = arg("universityId");
  if (!universityId) throw new Error("Missing --universityId");
  const ratio = Number(arg("ratio", "0.6"));

  const uniSnap = await db.doc(`universities/${universityId}`).get();
  if (!uniSnap.exists) throw new Error("University not found");
  const uni = uniSnap.data() as { representatives?: string[]; name?: string };
  const repUid = (uni.representatives ?? [])[0] ?? "";
  const admins = await getAuth().listUsers(100);
  const adminUid = admins.users.find((u) => (u.customClaims as Record<string, string> | undefined)?.role === "admin")?.uid ?? "";

  // 1. Demo assessment from live questions
  const qSnap = await db.collection("questions").orderBy("order").get();
  const responses = qSnap.docs.map((d) => {
    const q = d.data() as { pillar: string; maxScore: number };
    return {
      questionId: d.id,
      pillar: q.pillar,
      answer: Math.round(q.maxScore * ratio),
      maxScore: q.maxScore,
      notes: "DEMO value for pipeline verification — replace with verified submission.",
    };
  });
  const aRef = await db.collection("assessments").add({
    universityId,
    userId: repUid,
    version: 1,
    previousAssessmentId: null,
    status: "submitted",
    pillarScores: { research: 0, curriculum: 0, infrastructure: 0, ethics: 0, industry: 0 },
    overallScore: 0,
    responses,
    submittedAt: FieldValue.serverTimestamp(),
  });
  console.log(`Demo assessment created: ${aRef.id}`);

  // 2. Score (same algorithm as calculateAssessmentScore)
  const byPillar: Record<string, { earned: number; possible: number }> = {};
  const qMap = new Map(qSnap.docs.map((d) => [d.id, d.data() as { pillar: string; weight: number }]));
  for (const r of responses) {
    const q = qMap.get(r.questionId)!;
    const p = r.pillar;
    byPillar[p] ??= { earned: 0, possible: 0 };
    byPillar[p].earned += (r.answer / r.maxScore) * (q.weight ?? 1);
    byPillar[p].possible += q.weight ?? 1;
  }
  const pillarScores: Record<string, number> = {};
  for (const p of Object.keys(PILLAR_WEIGHTS)) {
    const b = byPillar[p];
    pillarScores[p] = b && b.possible > 0 ? Math.round((b.earned / b.possible) * 100) : 0;
  }
  const overallScore = Math.round(
    Object.entries(PILLAR_WEIGHTS).reduce((acc, [p, w]) => acc + (pillarScores[p] ?? 0) * w, 0)
  );
  await aRef.update({ pillarScores, overallScore });
  await db.doc(`universities/${universityId}`).update({
    score: overallScore,
    pillarScores,
    lastAssessmentAt: FieldValue.serverTimestamp(),
    assessmentCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`Scored: overall=${overallScore} pillars=${JSON.stringify(pillarScores)}`);

  // 3. Validate as admin
  await aRef.update({ status: "validated", reviewedBy: adminUid, reviewNotes: "DEMO validation for pipeline verification." });
  console.log("Validated.");

  // 4. Recompute rankings (shared module — same shape as /api/admin/recalculate)
  const { recomputeRankings } = await import("./recompute");
  const { ranked, approved } = await recomputeRankings(db);
  console.log(`Rankings recomputed: ${ranked} ranked of ${approved} approved universities.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
