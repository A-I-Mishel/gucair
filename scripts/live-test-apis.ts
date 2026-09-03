/** Live test: exercise every /api/admin/* route against the local dev server. */
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
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
  const { users } = await getAuth().listUsers(100);
  const admin = users.find((u) => (u.customClaims as Record<string, string> | undefined)?.role === "admin");
  if (!admin) throw new Error("No admin user found");
  const customToken = await getAuth().createCustomToken(admin.uid);
  const exRes = await fetch(
    `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  if (!exRes.ok) throw new Error(`Token exchange failed: ${exRes.status}`);
  const { idToken } = (await exRes.json()) as { idToken: string };
  const authH = { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` };
  const base = "http://localhost:3000";
  const show = (label: string, status: number, body: string) =>
    console.log(`${label}: ${status} ${body.slice(0, 300)}`);

  // 1. seed-questions (idempotent)
  let r = await fetch(`${base}/api/admin/seed-questions`, { method: "POST", headers: authH, body: "{}" });
  show("seed-questions", r.status, JSON.stringify(await r.json()));

  // 2. upload-csv: 1 good row (dupe of seeded MIT), 1 new row, 1 bad row
  const csv = [
    "name,country,region,city,lat,lng,website,type,studentCount,facultyCount,year",
    '"Massachusetts Institute of Technology",USA,"North America",Cambridge,42.3601,-71.0942,https://web.mit.edu,private,11500,1300,1861',
    '"Testville University",Testland,Europe,Testville,10.0,20.0,https://example.edu,public,1000,100,2000',
    '"Broken Row",Nowhere,Europe,,,notalat,20.0,,public,,,"',
  ].join("\n");
  const form = new FormData();
  form.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");
  r = await fetch(`${base}/api/admin/upload-csv`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: form,
  });
  show("upload-csv", r.status, JSON.stringify(await r.json()));

  // 3. add-university: valid, then duplicate (409), then invalid (400)
  const good = {
    name: "Manual Test University", country: "Testland", region: "Europe", city: "Manual City",
    lat: 11, lng: 22, website: null, type: "public", studentCount: null, facultyCount: null, year: null,
  };
  r = await fetch(`${base}/api/admin/add-university`, { method: "POST", headers: authH, body: JSON.stringify(good) });
  const goodBody = (await r.json()) as { id?: string };
  show("add-university", r.status, JSON.stringify(goodBody));
  r = await fetch(`${base}/api/admin/add-university`, { method: "POST", headers: authH, body: JSON.stringify(good) });
  show("add-university (dupe)", r.status, JSON.stringify(await r.json()).slice(0, 120));
  r = await fetch(`${base}/api/admin/add-university`, {
    method: "POST", headers: authH, body: JSON.stringify({ name: "x" }),
  });
  show("add-university (bad)", r.status, JSON.stringify(await r.json()).slice(0, 120));

  // 4. set-role: flip rep -> public -> rep (leaves state unchanged)
  const rep = users.find((u) => u.email?.includes("+rep@"));
  if (rep) {
    const flip = async (role: string) => {
      const rr = await fetch(`${base}/api/admin/set-role`, {
        method: "POST", headers: authH,
        body: JSON.stringify({ uid: rep.uid, role, universityId: "bgMcFwLRLCX46QRafpeg" }),
      });
      return rr.status;
    };
    console.log("set-role flip:", await flip("public"), "->", await flip("rep"));
    const check = await getAuth().getUser(rep.uid);
    console.log("rep claims after flip:", JSON.stringify(check.customClaims));
  }

  // 5. recalculate
  r = await fetch(`${base}/api/admin/recalculate`, { method: "POST", headers: authH, body: "{}" });
  show("recalculate", r.status, JSON.stringify(await r.json()));

  // 6. Cleanup test rows so production stays clean
  const { getFirestore } = await import("firebase-admin/firestore");
  const db = getFirestore();
  for (const [n, c] of [["Testville University", "Testland"], ["Manual Test University", "Testland"]] as const) {
    const s = await db.collection("universities").where("name", "==", n).where("country", "==", c).get();
    for (const d of s.docs) await d.ref.delete();
  }
  if (goodBody.id) await db.doc(`universities/${goodBody.id}`).delete().catch(() => {});
  console.log("test rows cleaned");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
