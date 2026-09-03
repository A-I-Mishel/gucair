/** Generate SVG banners, upload to Cloudinary, set articles' imageUrl. Usage: npx tsx scripts/article-images.ts */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";
import { join } from "path";

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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function banner(tag: string, lines: string[], accent: string): string {
  const title = lines.map((l, i) => `<text x="80" y="${300 + i * 72}" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="#ffffff">${esc(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a5f"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="1050" cy="90" r="180" fill="#ffffff" opacity="0.07"/><circle cx="140" cy="560" r="120" fill="#ffffff" opacity="0.06"/><rect x="80" y="120" width="64" height="64" rx="14" fill="#2dd4bf"/><text x="112" y="168" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#1e3a5f" text-anchor="middle">G</text><rect x="80" y="210" width="220" height="40" rx="20" fill="#ffffff" opacity="0.2"/><text x="190" y="238" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="3">${esc(tag)}</text>${title}<text x="80" y="560" font-family="Arial, sans-serif" font-size="26" fill="#2dd4bf" letter-spacing="2">GUCAIR · GLOBAL UNIVERSITY CONSORTIUM OF AI READINESS</text></svg>`;
}

const BANNERS: { slug: string; tag: string; lines: string[]; accent: string }[] = [
  { slug: "gucair-launches-17-founding-universities", tag: "ANNOUNCEMENT", lines: ["51 universities.", "6 regions.", "One readiness standard."], accent: "#0f766e" },
  { slug: "five-pillar-framework-explainer", tag: "METHODOLOGY", lines: ["Five pillars.", "22 questions.", "One comparable score."], accent: "#334155" },
  { slug: "spotlight-ndub-first-assessment", tag: "SPOTLIGHT", lines: ["NDUB leads", "the pilot at 37."], accent: "#0d9488" },
];

async function uploadSvg(svg: string, filename: string, cloud: string, preset: string): Promise<string> {
  const path = join(tmpdir(), filename);
  writeFileSync(path, svg);
  const buf = readFileSync(path);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: "image/svg+xml" }), filename);
  form.append("upload_preset", preset);
  for (const folder of ["gucair/articles", ""]) {
    const f2 = new FormData();
    f2.append("file", new Blob([new Uint8Array(buf)], { type: "image/svg+xml" }), filename);
    f2.append("upload_preset", preset);
    if (folder) f2.append("folder", folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: f2 });
    if (res.ok) {
      const data = (await res.json()) as { secure_url: string };
      return data.secure_url;
    }
    if (folder === "") {
      const err = await res.text().catch(() => "");
      throw new Error(`Cloudinary upload failed: ${res.status} ${err.slice(0, 160)}`);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  loadEnv();
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  if (!cloud || !preset) throw new Error("Cloudinary env missing");
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
  for (const b of BANNERS) {
    const url = await uploadSvg(banner(b.tag, b.lines, b.accent), `${b.slug}.svg`, cloud, preset);
    const snap = await db.collection("articles").where("slug", "==", b.slug).limit(1).get();
    if (snap.empty) {
      console.log(`Article not found: ${b.slug} (uploaded anyway: ${url})`);
      continue;
    }
    await snap.docs[0].ref.update({ imageUrl: url, updatedAt: FieldValue.serverTimestamp() });
    console.log(`${b.slug} -> ${url}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
