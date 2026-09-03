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
  {
    title: "How to join the consortium: from application to first ranking",
    slug: "how-to-join-gucair",
    excerpt: "Apply in 2 minutes, get approved, receive your rep account, submit the 22-question assessment — ranked within days.",
    tags: ["guide", "join"],
    content: `<h2>Four steps to the board</h2><ol><li><strong>Apply</strong> — fill the <a href="/contact">Join form</a> (name, country, city, website, contact email). Your university appears as <em>pending</em>.</li><li><strong>Get approved</strong> — a consortium admin reviews applications in the dashboard, typically within days.</li><li><strong>Receive your rep account</strong> — the admin creates your representative login linked to your university.</li><li><strong>Submit the assessment</strong> — answer 22 questions across five pillars with evidence, submit for review, and appear on the rankings after validation.</li></ol><p>Scores start at <em>null</em> (gray "awaiting assessment") — only validated assessments produce a rank.</p>`,
  },
  {
    title: "Rep guide: completing your 22-question assessment",
    slug: "rep-assessment-guide",
    excerpt: "Five steps, auto-saving drafts, Cloudinary evidence uploads, and what happens after you hit Submit.",
    tags: ["guide", "assessment"],
    content: `<h2>Before you start</h2><p>Gather evidence first: publication counts, funding figures, course catalogs, compute inventories, policy documents, partnership agreements. Each question accepts a file upload or a URL plus free-text notes.</p><h2>The five steps</h2><ul><li><strong>Research (5 questions, 0–20 each)</strong> — publications, funding, labs, patents, interdisciplinary initiatives</li><li><strong>Curriculum (5 questions, 0–20 each)</strong> — undergrad/grad AI courses, interdisciplinary programs, non-CS literacy, faculty training</li><li><strong>Infrastructure (4 questions, 0–25 each)</strong> — GPU capacity, cloud partnerships, HPC, data infrastructure</li><li><strong>Ethics (4 questions, 0–25 each)</strong> — review board, bias audits, privacy policies, governance framework</li><li><strong>Industry (4 questions, 0–25 each)</strong> — partnerships, internships, tech transfer, joint centers</li></ul><h2>Drafts and versions</h2><p>Drafts auto-save every 30 seconds and are versioned — your v2 pre-loads the pattern so you only update what changed. On Submit, scores compute instantly and the assessment enters the admin review queue.</p>`,
  },
  {
    title: "Understanding your score: the math behind the 37",
    slug: "understanding-your-score",
    excerpt: "NDUB's 37 worked out: pillar averages scaled to 100, blended by pillar weights. Reproduce it by hand here.",
    tags: ["methodology", "scores"],
    content: `<h2>Pillars first</h2><p>Each pillar averages its questions (answer ÷ max), scaled to 0–100. NDUB v2: Research 28, Curriculum 42, Infrastructure 43, Ethics 35, Industry 36.</p><h2>Then the blend</h2><p>Overall = 0.25×28 + 0.25×42 + 0.20×43 + 0.15×35 + 0.15×36 = 7 + 10.5 + 8.6 + 5.25 + 5.4 = 36.75 → <strong>37</strong>.</p><h2>Bands</h2><ul><li>90+ Leading (blue) · 70–89 Advanced (green) · 40–69 Developing (yellow) · below 40 Emerging (red)</li><li>No assessment yet: gray "awaiting assessment" — never a zero, which would imply measured failure</li></ul>`,
  },
  {
    title: "Pilot rankings: why some rows are provisional",
    slug: "pilot-rankings-provisional",
    excerpt: "11 rows are admin estimates awaiting rep verification; 40 await first assessment. How to read the table honestly.",
    tags: ["announcement", "rankings"],
    content: `<h2>What "provisional" means</h2><p>During the pilot, rows without a validated rep assessment carry admin estimates so the table, charts, and maps can be evaluated end-to-end. Every provisional answer is labeled in the assessment's notes, and the rankings page carries a pilot-phase banner.</p><h2>How rows become real</h2><p>The moment a rep's validated assessment lands, it supersedes the provisional row on the next recalculation — no admin cleanup needed. Gray directory entries are members that have never been scored at all.</p>`,
  },
  {
    title: "Board state: 51 members, 6 regions, first blood to Asia",
    slug: "board-state-51-members",
    excerpt: "North America 16, Asia 12, Europe 11, Africa 5, Oceania 4, South America 3 — and NDUB puts Asia on the scoreboard first.",
    tags: ["announcement", "rankings"],
    content: `<h2>The membership map</h2><ul><li><strong>North America 16</strong> — MIT, Stanford, CMU, Ivies, Toronto, McGill, UBC, Tec de Monterrey</li><li><strong>Asia 12</strong> — Tsinghua, Peking, KAIST, NUS, NTU, IITs, Tokyo pair, plus NDUB</li><li><strong>Europe 11</strong> — Oxford, Cambridge, ETH, Imperial, EPFL and more</li><li><strong>Africa 5, Oceania 4, South America 3</strong> — the next assessment frontiers</li></ul><h2>First blood</h2><p>NDUB's validated 37 puts <strong>Asia on the scoreboard first</strong>. Regional averages activate as each region's members complete assessments — watch the homepage counters.</p>`,
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
