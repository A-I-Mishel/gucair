import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import type { Region } from "@/types";

const REGIONS = ["North America", "Europe", "Asia", "Africa", "South America", "Oceania"] as const;
const TYPES = ["public", "private", "research_institute"] as const;

const numOrNull = (v: unknown): number | null => {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

/**
 * Secondary method. Accepts multipart form-data with a `file` field (.csv).
 * Columns: name,country,region,city,lat,lng,website,type,studentCount,facultyCount,year
 * Invalid rows are skipped and reported — never crashes the batch.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing CSV file field 'file'" }, { status: 400 });
    }
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 50) {
      return NextResponse.json({ error: "CSV has too many parse errors" }, { status: 400 });
    }

    const db = adminDb();
    const existingSnap = await db.collection("universities").get();
    const existing = new Set(
      existingSnap.docs.map((d) => {
        const u = d.data() as { name?: string; country?: string };
        return `${String(u.name ?? "").toLowerCase()}|${String(u.country ?? "").toLowerCase()}`;
      })
    );

    let created = 0;
    const results: { name: string; status: string; reason?: string }[] = [];

    for (const row of parsed.data) {
      const name = (row.name ?? "").trim();
      const country = (row.country ?? "").trim();
      const region = (row.region ?? "").trim();
      const city = (row.city ?? "").trim();
      const lat = Number(row.lat);
      const lng = Number(row.lng);
      const fail = (reason: string) => results.push({ name: name || "(unnamed)", status: "failed", reason });

      if (!name || !country) { fail("Missing required field: name/country"); continue; }
      if (!city) { fail("Missing required field: city"); continue; }
      if (Number.isNaN(lat) || Number.isNaN(lng)) { fail("Invalid lat/lng"); continue; }
      if (!(REGIONS as readonly string[]).includes(region)) { fail(`Invalid region (one of: ${REGIONS.join(", ")})`); continue; }
      const key = `${name.toLowerCase()}|${country.toLowerCase()}`;
      if (existing.has(key)) {
        results.push({ name, status: "exists" });
        continue;
      }

      const ref = await db.collection("universities").add({
        name,
        country,
        region: region as Region,
        city,
        lat,
        lng,
        website: (row.website ?? "").trim() || null,
        type: (TYPES as readonly string[]).includes((row.type ?? "").trim()) ? row.type.trim() : "public",
        studentCount: numOrNull(row.studentCount),
        facultyCount: numOrNull(row.facultyCount),
        year: numOrNull(row.year),
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
      existing.add(key);
      created++;
      results.push({ name, status: "created", reason: ref.id });
    }

    const failed = results.filter((r) => r.status === "failed").length;
    return NextResponse.json({ created, failed, universities: results });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
