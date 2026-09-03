import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-guard";

/** Set custom claims + mirror to /users/{uid}. Admin callers only. */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { uid, role, universityId } = (await req.json()) as {
      uid?: string;
      role?: string;
      universityId?: string;
    };
    if (!uid || !role) return NextResponse.json({ error: "uid and role required" }, { status: 400 });
    if (!["public", "rep", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role (public | rep | admin)" }, { status: 400 });
    }

    const claims: Record<string, string> = { role };
    if (role === "rep" && universityId) claims.universityId = universityId;

    await adminAuth().setCustomUserClaims(uid, claims);
    await adminDb().doc(`users/${uid}`).set(
      { role, ...(universityId ? { universityId } : {}) },
      { merge: true }
    );
    await adminAuth().revokeRefreshTokens(uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
