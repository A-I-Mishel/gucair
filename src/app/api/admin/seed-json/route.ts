import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import seedData from "../../../../../data/seed-universities.json";
import type { Region } from "@/types";

const REGIONS = ["North America", "Europe", "Asia", "Africa", "South America", "Oceania"] as const;

interface SeedEntry {
  name: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  website?: string | null;
  type?: string;
  studentCount?: number | null;
  facultyCount?: number | null;
  year?: number | null;
}

/**
 * Primary seeding method. Reads data/seed-universities.json (data file, NOT code)
 * and creates approved university docs. Idempotent on name+country — safe to re-run.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const db = adminDb();
    const existingSnap = await db.collection("universities").get();
    const existing = new Set(
      existingSnap.docs.map((d) => {
        const u = d.data() as { name?: string; country?: string };
        return `${String(u.name ?? "").toLowerCase()}|${String(u.country ?? "").toLowerCase()}`;
      })
    );

    let created = 0;
    let skipped = 0;
    const results: { name: string; id?: string; status: string }[] = [];

    for (const entry of seedData as SeedEntry[]) {
      const key = `${entry.name.toLowerCase()}|${entry.country.toLowerCase()}`;
      if (existing.has(key)) {
        skipped++;
        results.push({ name: entry.name, status: "exists" });
        continue;
      }
      if (!entry.name || !entry.country || typeof entry.lat !== "number" || typeof entry.lng !== "number") {
        skipped++;
        results.push({ name: entry.name || "(unnamed)", status: "failed" });
        continue;
      }
      if (!(REGIONS as readonly string[]).includes(entry.region)) {
        skipped++;
        results.push({ name: entry.name, status: "failed" });
        continue;
      }
      const ref = await db.collection("universities").add({
        name: entry.name,
        country: entry.country,
        region: entry.region as Region,
        city: entry.city,
        lat: entry.lat,
        lng: entry.lng,
        website: entry.website ?? null,
        type: ["public", "private", "research_institute"].includes(entry.type ?? "") ? entry.type : "public",
        studentCount: entry.studentCount ?? null,
        facultyCount: entry.facultyCount ?? null,
        year: entry.year ?? null,
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
      results.push({ name: entry.name, id: ref.id, status: "created" });
    }

    return NextResponse.json({ created, skipped, universities: results });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seed failed" }, { status: 500 });
  }
}
