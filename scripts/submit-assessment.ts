/**
 * Submit a real assessment for a university (Admin SDK, attributes to the rep).
 * Answers are keyed by question ORDER: --answers "4,2,2,0,4,..." (22 numbers).
 * Every response carries a provenance note. Use --validate to validate + recompute.
 * Usage:
 *   npx tsx scripts/submit-assessment.ts --universityId <id> --answers "4,2,..." --note "..." [--validate]
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
  research: 0.25, curriculum: 0.25, infrastructure: 0.2, ethics: 0.15, industry: 0.15,
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
  const note = arg("note", "Submitted via admin script on behalf of the university rep.");
  const doValidate = process.argv.includes("--validate");
  if (!universityId) throw new Error("Missing --universityId");
  const values = arg("answers").split(",").map((s) => Number(s.trim()));
  if (values.length !== 22 || values.some((n) => Number.isNaN(n))) {
    throw new Error("--answers must be 22 comma-separated numbers (question order 1-22)");
  }

  const uniSnap = await db.doc(`universities/${universityId}`).get();
  if (!uniSnap.exists) throw new Error("University not found");
  const repUid = ((uniSnap.data() as { representatives?: string[] }).representatives ?? [])[0] ?? "";

  const qSnap = await db.collection("questions").orderBy("order").get();
  if (qSnap.size !== 22) throw new Error(`Expected 22 questions, found ${qSnap.size}`);
  const responses = qSnap.docs.map((d, i) => {
    const q = d.data() as { pillar: string; maxScore: number };
    const max = q.maxScore;
    const ans = Math.max(0, Math.min(values[i], max));
    return { questionId: d.id, pillar: q.pillar, answer: ans, maxScore: max, notes: note };
  });

  // Versioning
  const prev = await db.collection("assessments").where("universityId", "==", universityId).get();
  let maxV = 0;
  let latestId: string | null = null;
  prev.docs.forEach((d) => {
    const v = (d.data() as { version?: number }).version ?? 0;
    if (v > maxV) { maxV = v; latestId = d.id; }
  });

  // Weighted scoring (same algorithm as lib/scoring.ts)
  const qMap = new Map(qSnap.docs.map((d) => [d.id, d.data() as { pillar: string; weight: number }]));
  const byPillar: Record<string, { earned: number; possible: number }> = {};
  for (const r of responses) {
    const q = qMap.get(r.questionId)!;
    byPillar[r.pillar] ??= { earned: 0, possible: 0 };
    byPillar[r.pillar].earned += (r.answer / r.maxScore) * (q.weight ?? 1);
    byPillar[r.pillar].possible += q.weight ?? 1;
  }
  const pillarScores: Record<string, number> = {};
  for (const p of Object.keys(PILLAR_WEIGHTS)) {
    const b = byPillar[p];
    pillarScores[p] = b && b.possible > 0 ? Math.round((b.earned / b.possible) * 100) : 0;
  }
  const overallScore = Math.round(
    Object.entries(PILLAR_WEIGHTS).reduce((acc, [p, w]) => acc + (pillarScores[p] ?? 0) * w, 0)
  );

  const aRef = await db.collection("assessments").add({
    universityId,
    userId: repUid,
    version: maxV + 1,
    previousAssessmentId: latestId,
    status: doValidate ? "validated" : "submitted",
    pillarScores,
    overallScore,
    responses,
    submittedAt: FieldValue.serverTimestamp(),
  });

  if (doValidate) {
    const admins = await getAuth().listUsers(100);
    const adminUid =
      admins.users.find((u) => (u.customClaims as Record<string, string> | undefined)?.role === "admin")?.uid ?? "";
    await aRef.update({ reviewedBy: adminUid, reviewNotes: "Validated by admin." });
  }

  await db.doc(`universities/${universityId}`).update({
    score: overallScore,
    pillarScores,
    lastAssessmentAt: FieldValue.serverTimestamp(),
    assessmentCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const { recomputeRankings } = await import("./recompute");
  const { ranked, approved } = await recomputeRankings(db);
  console.log(
    `Assessment ${aRef.id} v${maxV + 1}: overall=${overallScore} pillars=${JSON.stringify(pillarScores)} (${doValidate ? "validated" : "submitted"}). Rankings: ${ranked}/${approved}.`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
