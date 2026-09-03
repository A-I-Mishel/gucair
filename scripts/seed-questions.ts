/**
 * Seed /questions with the 22-question framework.
 * Run with: npm run seed:questions
 * Requires FIREBASE_ADMIN_* env vars (uses firebase-admin).
 * Uses tsx so no build step is needed.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { QUESTIONS } from "./question-bank";

async function main() {
  // Load .env.local when run via plain tsx (Next.js does this automatically, tsx does not).
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    const { readFileSync, existsSync } = await import("fs");
    const { resolve } = await import("path");
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
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!, privateKey }) });
  }
  const db = getFirestore();
  let n = 0;
  for (const q of QUESTIONS) {
    await db.collection("questions").add(q);
    n++;
  }
  console.log(`Seeded ${n} assessment questions.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
