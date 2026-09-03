/**
 * Promote a user to a role (sets Auth custom claims + mirrors /users doc).
 * Usage:
 *   npx tsx scripts/promote-admin.ts --list
 *   npx tsx scripts/promote-admin.ts user@example.com --role admin
 *   npx tsx scripts/promote-admin.ts rep@example.com --role rep --universityId <id>
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

async function main() {
  loadEnv();
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
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
  const auth = getAuth();
  const db = getFirestore();
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    const res = await auth.listUsers(100);
    console.log(`Users (${res.users.length}):`);
    for (const u of res.users) {
      console.log(`- ${u.email} | uid=${u.uid} | claims=${JSON.stringify(u.customClaims ?? {})}`);
    }
    return;
  }

  const email = args.find((a) => !a.startsWith("--"));
  const roleIdx = args.indexOf("--role");
  const role = roleIdx >= 0 ? args[roleIdx + 1] : "admin";
  const uniIdx = args.indexOf("--universityId");
  const universityId = uniIdx >= 0 ? args[uniIdx + 1] : undefined;
  if (!email) throw new Error("Provide an email: npx tsx scripts/promote-admin.ts user@example.com --role admin");

  const user = await auth.getUserByEmail(email);
  const claims: Record<string, string> = { role };
  if (role === "rep" && universityId) claims.universityId = universityId;
  await auth.setCustomUserClaims(user.uid, claims);
  await db.doc(`users/${user.uid}`).set(
    { email: user.email ?? email, role, ...(universityId ? { universityId } : {}) },
    { merge: true }
  );
  console.log(`Promoted ${email} (uid=${user.uid}) to role=${role}. User must sign out/in to refresh claims.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
