import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import type { Region } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  region: z.enum(["North America", "Europe", "Asia", "Africa", "South America", "Oceania"]),
  city: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  website: z.string().url().nullish(),
  type: z.enum(["public", "private", "research_institute"]).default("public"),
  studentCount: z.number().int().nonnegative().nullish(),
  facultyCount: z.number().int().nonnegative().nullish(),
  year: z.number().int().min(1000).max(2100).nullish(),
});

/** Tertiary method. Manual one-by-one addition, Zod-validated. */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid fields", issues: parsed.error.flatten() }, { status: 400 });
    }
    const v = parsed.data;

    const db = adminDb();
    const dup = await db
      .collection("universities")
      .where("name", "==", v.name)
      .where("country", "==", v.country)
      .limit(1)
      .get();
    if (!dup.empty) {
      return NextResponse.json({ error: "University already exists (name + country)" }, { status: 409 });
    }

    const ref = await db.collection("universities").add({
      name: v.name,
      country: v.country,
      region: v.region as Region,
      city: v.city,
      lat: v.lat,
      lng: v.lng,
      website: v.website ?? null,
      type: v.type,
      studentCount: v.studentCount ?? null,
      facultyCount: v.facultyCount ?? null,
      year: v.year ?? null,
      status: "approved",
      representatives: [],
      score: null,
      pillarScores: null,
      assessmentCount: 0,
      logoUrl: null,
      lastAssessmentAt: null,
      joinedAt: new Date(),
      updatedAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Add failed" }, { status: 500 });
  }
}
