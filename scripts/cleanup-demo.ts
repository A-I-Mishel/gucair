/**
 * Remove a demo/test assessment and rebuild affected aggregates from remaining data.
 * Usage: npx tsx scripts/cleanup-demo.ts --assessmentId <id>
 * - Deletes the assessment doc
 * - Recomputes the university's score from its remaining VALIDATED assessments (or zeros)
  * - Recomputes stats + all rankings docs
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

async function main() {
  loadEnv();
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
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
  const assessmentId = arg("assessmentId");
  let universityId = arg("universityId");
  if (!assessmentId && !universityId) throw new Error("Missing --assessmentId or --universityId");

  if (assessmentId) {
    const aSnap = await db.doc(`assessments/${assessmentId}`).get();
    if (aSnap.exists) {
      universityId = (aSnap.data() as { universityId: string }).universityId;
      await db.doc(`assessments/${assessmentId}`).delete();
      console.log(`Deleted assessment ${assessmentId}`);
    } else {
      console.log(`Assessment ${assessmentId} already gone; rebuilding aggregates.`);
    }
  }
  if (!universityId) throw new Error("Could not determine universityId");

  // Rebuild university score from remaining validated assessments (latest version wins).
  // Single-filter query only (no composite index needed); filter in code.
  const rest = await db
    .collection("assessments")
    .where("universityId", "==", universityId)
    .get();
  const validated = rest.docs
    .map((d) => d.data() as { status: string; overallScore: number; pillarScores: Record<string, number>; version: number })
    .filter((a) => a.status === "validated")
    .sort((a, b) => b.version - a.version);
  if (validated.length === 0) {
    await db.doc(`universities/${universityId}`).update({
      score: null,
      pillarScores: null,
      assessmentCount: 0,
      lastAssessmentAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`University ${universityId} reset to unscored (no validated assessments left).`);
  } else {
    const latest = validated[0];
    const count = validated.length;
    await db.doc(`universities/${universityId}`).update({
      score: latest.overallScore,
      pillarScores: latest.pillarScores,
      assessmentCount: count,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`University ${universityId} rebuilt from ${count} remaining validated assessment(s).`);
  }

  // Global recompute (shared module — same shape as /api/admin/recalculate)
  const { recomputeRankings } = await import("./recompute");
  const { ranked, approved } = await recomputeRankings(db);
  console.log(`Rankings recomputed (${ranked} ranked of ${approved} approved). Production slate is clean.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
