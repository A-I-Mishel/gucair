/**
 * Onboard a university + representative in one step (Admin SDK, bypasses rules).
 * Usage:
 *   npx tsx scripts/onboard-university.ts --name "..." --country "..." --region Asia \
 *     --city "..." --lat 0 --lng 0 --website https://... --type private \
 *     --establishedYear 2013 --repEmail rep@uni.edu --repName "Rep Name" [--repPassword ...]
 * If the rep email already exists, it is linked instead of created.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";

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
  const auth = getAuth();
  const db = getFirestore();

  const name = arg("name");
  if (!name) throw new Error("Missing --name");
  const repEmail = arg("repEmail");
  if (!repEmail) throw new Error("Missing --repEmail");

  // 1. Create university (approved)
  const uniRef = await db.collection("universities").add({
    name,
    country: arg("country"),
    region: arg("region"),
    city: arg("city"),
    lat: Number(arg("lat", "0")),
    lng: Number(arg("lng", "0")),
    logoUrl: arg("logoUrl") || null,
    website: arg("website") || null,
    type: arg("type", "private"),
    studentCount: arg("studentCount") ? Number(arg("studentCount")) : null,
    facultyCount: arg("facultyCount") ? Number(arg("facultyCount")) : null,
    year: arg("year") || arg("establishedYear") ? Number(arg("year") || arg("establishedYear")) : null,
    status: "approved",
    representatives: [],
    score: null,
    pillarScores: null,
    assessmentCount: 0,
    lastAssessmentAt: null,
    joinedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`University created: ${uniRef.id}`);

  // 2. Create or link rep user
  let uid: string;
  let tempPassword = "";
  try {
    tempPassword = arg("repPassword") || randomBytes(9).toString("base64url");
    const u = await auth.createUser({
      email: repEmail,
      password: tempPassword,
      displayName: arg("repName", repEmail),
      emailVerified: false,
    });
    uid = u.uid;
    console.log(`Rep user created: ${repEmail}`);
  } catch (e: unknown) {
    if (e instanceof Error && (e as { code?: string }).code === "auth/email-already-exists") {
      const u = await auth.getUserByEmail(repEmail);
      uid = u.uid;
      tempPassword = "(existing account — use its current password)";
      console.log(`Rep email already exists, linking: ${repEmail}`);
    } else {
      throw e;
    }
  }

  await auth.setCustomUserClaims(uid, { role: "rep", universityId: uniRef.id });
  await db.doc(`users/${uid}`).set(
    {
      email: repEmail,
      name: arg("repName", repEmail),
      role: "rep",
      universityId: uniRef.id,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await uniRef.update({ representatives: [uid] });

  console.log(`Linked ${repEmail} -> ${uniRef.id} as rep`);
  console.log(`TEMP PASSWORD: ${tempPassword}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
