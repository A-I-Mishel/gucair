/** One-time: real NDUB facts (Wikipedia/UGC) + 3 launch articles. Usage: npx tsx scripts/real-content.ts */
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

const ARTICLES = [
  {
    title: "GUCAIR launches with 17 founding universities across 6 regions",
    slug: "gucair-launches-17-founding-universities",
    excerpt: "The Global University Consortium of AI Readiness opens with members from North America to Oceania — all starting their first assessments.",
    tags: ["announcement", "consortium"],
    content: `<h2>A global baseline for AI readiness</h2><p>The <strong>Global University Consortium of AI Readiness (GUCAIR)</strong> is now live with <strong>17 founding member universities</strong> spanning all six regions — from MIT and Stanford to Tsinghua, IIT Bombay, Cape Town, São Paulo, and Sydney.</p><h2>What happens next</h2><ul><li>Each member's representative completes the 22-question assessment across the five pillars</li><li>Consortium admins validate submissions</li><li>Rankings, benchmarks, and trend tracking go live as scores are validated</li></ul><p>Universities not yet listed can apply through the <a href="/contact">Join page</a>.</p>`,
  },
  {
    title: "How the five-pillar AI readiness framework works",
    slug: "five-pillar-framework-explainer",
    excerpt: "Research 25%, Curriculum 25%, Infrastructure 20%, Ethics 15%, Industry 15% — how 22 questions become one comparable score.",
    tags: ["methodology", "framework"],
    content: `<h2>Five pillars, one score</h2><p>Every member answers the same <strong>22 questions</strong>: 5 on Research &amp; Innovation (25%), 5 on Curriculum &amp; Education (25%), 4 on Infrastructure &amp; Compute (20%), 4 on Ethics &amp; Governance (15%), and 4 on Industry &amp; Partnership (15%).</p><h2>How scoring works</h2><p>Each pillar score is the weighted average of its questions, scaled to 0–100. The overall score blends the pillars by their weights. Scores are computed on submission and locked when a consortium admin validates the assessment.</p><p>Read the full <a href="/methodology">methodology</a>.</p>`,
  },
  {
    title: "Member spotlight: Notre Dame University Bangladesh completes first assessment",
    slug: "spotlight-ndub-first-assessment",
    excerpt: "NDUB's v1 assessment scores 17 (Emerging) — strongest in Curriculum at 26, with clear headroom in Ethics and Research.",
    tags: ["spotlight", "members"],
    content: `<h2>First score on the board</h2><p><strong>Notre Dame University Bangladesh (NDUB)</strong>, a private university in Dhaka founded in 2013 with around 8,000 students, is the first member to complete a validated AI readiness assessment — overall <strong>17 (Emerging)</strong>.</p><h2>Where it stands</h2><ul><li><strong>Curriculum 26</strong> — strongest pillar, carried by B.Sc. and M.Sc. CSE programs including AI, machine learning, and data mining courses</li><li><strong>Infrastructure 17, Industry 14, Research 12</strong> — early-stage, typical of a young teaching-focused university</li><li><strong>Ethics 11</strong> — the clearest growth area: no dedicated AI ethics board or bias-audit protocols yet</li></ul><p>These are v1 estimates from public sources, flagged for verification in the next assessment cycle. Follow NDUB's trend on its <a href="/universities/bgMcFwLRLCX46QRafpeg">profile page</a>.</p>`,
  },
];

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
  const { users } = await getAuth().listUsers(100);
  const adminUid = users.find((u) => (u.customClaims as Record<string, string> | undefined)?.role === "admin")?.uid ?? "admin";

  // Real NDUB facts (Wikipedia + UGC Bangladesh)
  await db.doc("universities/bgMcFwLRLCX46QRafpeg").update({
    studentCount: 8000,
    facultyCount: 175,
    lat: 23.7296,
    lng: 90.4211,
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("NDUB facts updated (8000 students, 175 faculty, exact coords).");

  for (const a of ARTICLES) {
    const dup = await db.collection("articles").where("slug", "==", a.slug).limit(1).get();
    if (!dup.empty) {
      console.log(`Exists, skipped: ${a.slug}`);
      continue;
    }
    await db.collection("articles").add({
      ...a,
      authorId: adminUid,
      imageUrl: null,
      status: "published",
      publishedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Published: ${a.slug}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
