/** One-time: refresh stale launch articles (51 members, NDUB v2/37). Usage: npx tsx scripts/refresh-articles.ts */
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

  const updates: Record<string, { title?: string; excerpt: string; content: string }> = {
    "gucair-launches-17-founding-universities": {
      title: "GUCAIR launches with 51 member universities across 6 regions",
      excerpt:
        "The Global University Consortium of AI Readiness opens with 51 members from North America to Oceania — rankings already live.",
      content: `<h2>A global baseline for AI readiness</h2><p>The <strong>Global University Consortium of AI Readiness (GUCAIR)</strong> is now live with <strong>51 member universities</strong> spanning all six regions — from MIT and Stanford to Tsinghua, IIT Bombay, Cape Town, São Paulo, and Sydney.</p><h2>What happens next</h2><ul><li>Each member's representative completes the 22-question assessment across the five pillars</li><li>Consortium admins validate submissions</li><li>Rankings, benchmarks, and trend tracking update as scores are validated</li></ul><p>Universities not yet listed can apply through the <a href="/contact">Join page</a>.</p>`,
    },
    "spotlight-ndub-first-assessment": {
      excerpt:
        "NDUB's v2 assessment scores 37 (Emerging) — strongest in Infrastructure at 43, with headroom in Research and Ethics.",
      content: `<h2>First score on the board — now at v2</h2><p><strong>Notre Dame University Bangladesh (NDUB)</strong>, a private university in Dhaka founded in 2013 with around 8,000 students, leads the pilot phase with a v2 validated assessment scoring overall <strong>37 (Emerging)</strong>.</p><h2>Where it stands</h2><ul><li><strong>Infrastructure 43</strong> — strongest pillar: teaching labs and growing compute access</li><li><strong>Curriculum 42</strong> — B.Sc. and M.Sc. CSE programs including AI, machine learning, and data mining courses</li><li><strong>Industry 36, Ethics 35, Research 28</strong> — the growth areas for the next cycle</li></ul><p>Scores are admin estimates from public sources, flagged for verification in the next assessment cycle. Follow NDUB's trend on its <a href="/universities/bgMcFwLRLCX46QRafpeg">profile page</a>.</p>`,
    },
  };

  for (const [slug, patch] of Object.entries(updates)) {
    const snap = await db.collection("articles").where("slug", "==", slug).limit(1).get();
    if (snap.empty) {
      console.log(`Not found: ${slug}`);
      continue;
    }
    await snap.docs[0].ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
    console.log(`Updated: ${slug}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
