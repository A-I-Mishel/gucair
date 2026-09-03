/**
 * PROVISIONAL top-10 ranking seed (demo only — every answer labeled provisional).
 * Targets track broad public consensus on AI research standing; a v2 rep
 * submission supersedes these automatically (latest validated version wins).
 * Usage: npx tsx scripts/submit-provisional.ts
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

// name + pillar targets [research, curriculum, infrastructure, ethics, industry]
const PROVISIONAL: [string, [number, number, number, number, number]][] = [
  ["Massachusetts Institute of Technology", [96, 90, 96, 80, 93]],
  ["Stanford University", [94, 90, 93, 80, 93]],
  ["Carnegie Mellon University", [97, 92, 90, 78, 88]],
  ["University of California Berkeley", [93, 88, 86, 80, 85]],
  ["University of Oxford", [88, 86, 80, 85, 82]],
  ["University of Cambridge", [87, 85, 79, 85, 80]],
  ["Tsinghua University", [88, 84, 86, 75, 80]],
  ["ETH Zurich", [84, 82, 84, 82, 78]],
  ["National University of Singapore", [80, 82, 82, 80, 80]],
  ["University of Toronto", [84, 80, 76, 78, 76]],
  ["Harvard University", [88, 86, 82, 84, 84]],
  ["California Institute of Technology", [92, 85, 90, 76, 80]],
  ["Yale University", [80, 84, 72, 84, 78]],
  ["Princeton University", [82, 84, 74, 82, 76]],
  ["Columbia University", [82, 84, 76, 80, 80]],
  ["University of Chicago", [80, 84, 74, 82, 74]],
  ["University of Pennsylvania", [78, 84, 74, 80, 80]],
  ["University of California Los Angeles", [80, 82, 78, 78, 78]],
  ["McGill University", [76, 80, 70, 80, 72]],
  ["University of British Columbia", [76, 80, 72, 80, 74]],
  ["Tecnologico de Monterrey", [68, 76, 68, 72, 74]],
  ["Imperial College London", [88, 86, 84, 82, 80]],
  ["Technical University of Munich", [82, 82, 84, 78, 78]],
  ["University College London", [82, 84, 76, 80, 78]],
  ["EPFL", [86, 80, 88, 78, 76]],
  ["Delft University of Technology", [78, 80, 80, 76, 74]],
  ["KTH Royal Institute of Technology", [76, 78, 78, 78, 72]],
  ["University of Amsterdam", [74, 78, 70, 80, 70]],
  ["Politecnico di Milano", [76, 78, 78, 74, 72]],
  ["KAIST", [84, 80, 86, 74, 76]],
  ["Seoul National University", [80, 82, 78, 76, 74]],
  ["Peking University", [82, 82, 80, 72, 74]],
  ["Hong Kong University of Science and Technology", [78, 80, 80, 76, 78]],
  ["Nanyang Technological University", [78, 80, 82, 76, 78]],
  ["IIT Delhi", [76, 78, 74, 70, 68]],
  ["Tokyo Institute of Technology", [78, 76, 80, 72, 70]],
  ["University of Tokyo", [80, 82, 76, 76, 72]],
  ["IIT Bombay", [74, 76, 72, 70, 68]],
  ["University of Cape Town", [68, 72, 64, 74, 66]],
  ["Cairo University", [60, 68, 58, 66, 60]],
  ["American University in Cairo", [64, 72, 62, 70, 64]],
  ["University of Nairobi", [58, 64, 56, 64, 58]],
  ["Makerere University", [56, 62, 54, 62, 56]],
  ["University of São Paulo", [70, 74, 66, 70, 66]],
  ["University of Buenos Aires", [64, 70, 60, 68, 60]],
  ["University of Chile", [66, 70, 62, 68, 62]],
  ["University of Melbourne", [76, 80, 72, 78, 74]],
  ["University of Sydney", [76, 80, 72, 78, 74]],
  ["Australian National University", [74, 78, 70, 78, 70]],
  ["University of Auckland", [72, 76, 68, 76, 70]],
];

const PILLARS = ["research", "curriculum", "infrastructure", "ethics", "industry"];
const PILLAR_WEIGHTS: Record<string, number> = {
  research: 0.25, curriculum: 0.25, infrastructure: 0.2, ethics: 0.15, industry: 0.15,
};
const NOTE =
  "PROVISIONAL estimate for demo rankings (public-reputation based, not a rep submission) — superseded automatically by the first validated rep assessment.";

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
  const admins = await getAuth().listUsers(100);
  const adminUid =
    admins.users.find((u) => (u.customClaims as Record<string, string> | undefined)?.role === "admin")?.uid ?? "";

  const qSnap = await db.collection("questions").orderBy("order").get();
  const byPillar = new Map<string, { id: string; maxScore: number; weight: number }[]>();
  for (const d of qSnap.docs) {
    const q = d.data() as { pillar: string; maxScore: number; weight: number };
    if (!byPillar.has(q.pillar)) byPillar.set(q.pillar, []);
    byPillar.get(q.pillar)!.push({ id: d.id, maxScore: q.maxScore, weight: q.weight ?? 1 });
  }

  for (const [name, targets] of PROVISIONAL) {
    const uSnap = await db.collection("universities").where("name", "==", name).limit(1).get();
    if (uSnap.empty) {
      console.log(`NOT FOUND, skipped: ${name}`);
      continue;
    }
    const uni = uSnap.docs[0];
    const existing = await db
      .collection("assessments")
      .where("universityId", "==", uni.id)
      .where("status", "==", "validated")
      .get();
    if (!existing.empty) {
      console.log(`Already assessed, skipped: ${name}`);
      continue;
    }
    const responses = PILLARS.flatMap((pillar, pi) =>
      (byPillar.get(pillar) ?? []).map((q) => ({
        questionId: q.id,
        pillar,
        answer: Math.round((q.maxScore * targets[pi]) / 100),
        maxScore: q.maxScore,
        notes: NOTE,
      }))
    );
    // Score from constructed answers (same weighted algorithm)
    const pillarScores: Record<string, number> = {};
    for (const [pi, pillar] of PILLARS.entries()) {
      const qs = byPillar.get(pillar) ?? [];
      const earned = qs.reduce((a, q) => a + (Math.round((q.maxScore * targets[pi]) / 100) / q.maxScore) * q.weight, 0);
      const possible = qs.reduce((a, q) => a + q.weight, 0);
      pillarScores[pillar] = Math.round((earned / possible) * 100);
    }
    const overallScore = Math.round(
      Object.entries(PILLAR_WEIGHTS).reduce((acc, [p, w]) => acc + (pillarScores[p] ?? 0) * w, 0)
    );
    const aRef = await db.collection("assessments").add({
      universityId: uni.id,
      userId: "",
      version: 1,
      previousAssessmentId: null,
      status: "validated",
      pillarScores,
      overallScore,
      responses,
      submittedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      reviewNotes: "PROVISIONAL seed for demo rankings — awaiting first rep assessment.",
    });
    await uni.ref.update({
      score: overallScore,
      pillarScores,
      lastAssessmentAt: FieldValue.serverTimestamp(),
      assessmentCount: 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`${name}: ${overallScore} (${aRef.id})`);
  }

  const { recomputeRankings } = await import("./recompute");
  const { ranked, approved } = await recomputeRankings(db);
  console.log(`Rankings: ${ranked}/${approved}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
