/** Local equivalent of POST /api/admin/seed-json (same file, same dedupe). Usage: npx tsx scripts/seed-json-file.ts */
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
  const seed = JSON.parse(readFileSync(resolve(process.cwd(), "data/seed-universities.json"), "utf8")) as Record<string, unknown>[];
  const existing = await db.collection("universities").get();
  const have = new Set(
    existing.docs.map((d) => {
      const u = d.data() as { name?: string; country?: string };
      return `${String(u.name ?? "").toLowerCase()}|${String(u.country ?? "").toLowerCase()}`;
    })
  );
  let created = 0;
  let skipped = 0;
  for (const e of seed) {
    const u = e as { name: string; country: string };
    const key = `${u.name.toLowerCase()}|${u.country.toLowerCase()}`;
    if (have.has(key)) { skipped++; continue; }
    await db.collection("universities").add({
      ...e,
      status: "approved",
      representatives: [],
      score: null,
      pillarScores: null,
      assessmentCount: 0,
      logoUrl: null,
      lastAssessmentAt: null,
      joinedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    have.add(key);
    created++;
  }
  console.log(`seed-json-file: created=${created} skipped=${skipped}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
