import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/** Verify a Bearer ID token and require role=admin. Returns error response or null. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
  try {
    const decoded = await adminAuth().verifyIdToken(match[1], true);
    if ((decoded.role as string | undefined) !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: "Invalid or expired ID token" }, { status: 401 });
  }
}
