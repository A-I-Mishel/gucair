/** Read-only project status: collection counts + pre-computed docs. Usage: npx tsx scripts/status.ts */
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
  const { getFirestore } = await import("firebase-admin/firestore");
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
  for (const c of ["universities", "assessments", "users", "questions", "articles"]) {
    const s = await db.collection(c).count().get();
    console.log(`${c}: ${s.data().count}`);
  }
  const gs = await db.doc("stats/singleton").get();
  console.log(`stats/singleton: ${gs.exists ? "EXISTS" : "MISSING"}`);
  if (gs.exists) console.log(`  ${JSON.stringify(gs.data())?.slice(0, 220)}`);
  for (const r of ["global", "North America", "Europe", "Asia", "Africa", "South America", "Oceania"]) {
    const d = await db.doc(`rankings/${r}`).get();
    const n = d.exists ? ((d.data() as { list?: unknown[] }).list ?? []).length : -1;
    console.log(`rankings/${r}: ${n < 0 ? "MISSING" : n + " entries"}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
