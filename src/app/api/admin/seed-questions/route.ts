import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import type { PillarKey } from "@/types";

interface SeedQ {
  pillar: PillarKey;
  text: string;
  description: string;
  maxScore: number;
  weight: number;
  order: number;
  evidenceRequired: boolean;
}

const QUESTIONS: SeedQ[] = [
  { pillar: "research", text: "AI-related peer-reviewed publications in the last 3 years", description: "Count of peer-reviewed AI/ML publications.", maxScore: 20, weight: 1, order: 1, evidenceRequired: false },
  { pillar: "research", text: "AI research funding secured (USD millions) in the last 3 years", description: "Total external AI research funding.", maxScore: 20, weight: 1, order: 2, evidenceRequired: true },
  { pillar: "research", text: "Dedicated AI research labs/centers", description: "Number of dedicated AI labs or centers.", maxScore: 20, weight: 1, order: 3, evidenceRequired: false },
  { pillar: "research", text: "AI-related patents filed in the last 3 years", description: "Patents filed with AI subject matter.", maxScore: 20, weight: 1, order: 4, evidenceRequired: false },
  { pillar: "research", text: "Interdisciplinary AI research initiatives", description: "Cross-department AI research programs.", maxScore: 20, weight: 1, order: 5, evidenceRequired: false },
  { pillar: "curriculum", text: "AI/ML courses offered at undergraduate level", description: "Number of undergraduate AI/ML courses.", maxScore: 20, weight: 1, order: 6, evidenceRequired: false },
  { pillar: "curriculum", text: "AI/ML courses offered at graduate level", description: "Number of graduate AI/ML courses.", maxScore: 20, weight: 1, order: 7, evidenceRequired: false },
  { pillar: "curriculum", text: "Interdisciplinary AI programs", description: "AI + ethics, healthcare, etc.", maxScore: 20, weight: 1, order: 8, evidenceRequired: false },
  { pillar: "curriculum", text: "AI literacy programs for non-CS students", description: "AI literacy offerings outside CS.", maxScore: 20, weight: 1, order: 9, evidenceRequired: false },
  { pillar: "curriculum", text: "Faculty professional development in AI teaching", description: "Training programs for faculty.", maxScore: 20, weight: 1, order: 10, evidenceRequired: false },
  { pillar: "infrastructure", text: "GPU compute capacity", description: "FLOPS or GPU count available.", maxScore: 25, weight: 1, order: 11, evidenceRequired: true },
  { pillar: "infrastructure", text: "Cloud computing partnerships", description: "AWS, Azure, GCP partnerships.", maxScore: 25, weight: 1, order: 12, evidenceRequired: false },
  { pillar: "infrastructure", text: "High-Performance Computing (HPC) access for AI research", description: "HPC access for AI workloads.", maxScore: 25, weight: 1, order: 13, evidenceRequired: false },
  { pillar: "infrastructure", text: "Data storage and management infrastructure for AI datasets", description: "Infrastructure for AI datasets.", maxScore: 25, weight: 1, order: 14, evidenceRequired: false },
  { pillar: "ethics", text: "Existence of an AI ethics review board", description: "An institutional AI ethics board.", maxScore: 25, weight: 1, order: 15, evidenceRequired: true },
  { pillar: "ethics", text: "Bias audit and fairness testing protocols", description: "Documented fairness testing.", maxScore: 25, weight: 1, order: 16, evidenceRequired: true },
  { pillar: "ethics", text: "Student and faculty data privacy policies for AI systems", description: "Privacy policies covering AI.", maxScore: 25, weight: 1, order: 17, evidenceRequired: true },
  { pillar: "ethics", text: "AI governance framework documentation", description: "Published governance framework.", maxScore: 25, weight: 1, order: 18, evidenceRequired: true },
  { pillar: "industry", text: "Active industry partnerships for AI research", description: "Number of active partnerships.", maxScore: 25, weight: 1, order: 19, evidenceRequired: false },
  { pillar: "industry", text: "AI internship and placement programs with industry", description: "Industry internship programs.", maxScore: 25, weight: 1, order: 20, evidenceRequired: false },
  { pillar: "industry", text: "Technology transfer and commercialization initiatives", description: "Tech transfer initiatives.", maxScore: 25, weight: 1, order: 21, evidenceRequired: false },
  { pillar: "industry", text: "Joint AI research centers with industry partners", description: "Joint centers with partners.", maxScore: 25, weight: 1, order: 22, evidenceRequired: false },
];

/** Idempotent: only creates questions whose (order) slot is empty. */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const db = adminDb();
    const existing = await db.collection("questions").get();
    const takenOrders = new Set(existing.docs.map((d) => (d.data() as { order?: number }).order));
    let created = 0;
    for (const q of QUESTIONS) {
      if (takenOrders.has(q.order)) continue;
      await db.collection("questions").add(q);
      created++;
    }
    return NextResponse.json({ created, existing: existing.size, total: 22 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seed failed" }, { status: 500 });
  }
}
