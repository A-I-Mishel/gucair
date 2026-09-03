import { PILLARS, type AssessmentResponse, type PillarKey, type PillarScores } from "@/types";

export const PILLAR_WEIGHTS: Record<PillarKey, number> = Object.fromEntries(
  PILLARS.map((p) => [p.key, p.weight])
) as Record<PillarKey, number>;

export interface QuestionLike {
  id: string;
  pillar: PillarKey;
  maxScore: number;
  weight: number;
}

/**
 * Weighted scoring — shared by the client-side wizard submit and the
 * server-side recalculation sanity checks. Mirrors the original spec:
 * pillar = Σ(answer/maxScore × weight)/Σ(weight) × 100, overall = Σ(pillar × pillarWeight).
 */
export function calculateScores(
  responses: AssessmentResponse[],
  questions: QuestionLike[]
): { pillarScores: PillarScores; overallScore: number } {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const byPillar = {} as Record<PillarKey, { earned: number; possible: number }>;

  for (const r of responses) {
    const q = qMap.get(r.questionId);
    if (!q) continue;
    const max = Number(r.maxScore ?? q.maxScore ?? 0);
    const ans = Math.max(0, Math.min(Number(r.answer ?? 0), max));
    const w = Number(q.weight ?? 1);
    const p = (r.pillar ?? q.pillar) as PillarKey;
    byPillar[p] ??= { earned: 0, possible: 0 };
    byPillar[p].earned += (max > 0 ? ans / max : 0) * w;
    byPillar[p].possible += w;
  }

  const pillarScores = {} as PillarScores;
  for (const p of Object.keys(PILLAR_WEIGHTS) as PillarKey[]) {
    const b = byPillar[p];
    pillarScores[p] = b && b.possible > 0 ? Math.round((b.earned / b.possible) * 100) : 0;
  }
  const overallScore = Math.round(
    (Object.entries(PILLAR_WEIGHTS) as [PillarKey, number][]).reduce(
      (acc, [p, w]) => acc + (pillarScores[p] ?? 0) * w,
      0
    )
  );
  return { pillarScores, overallScore };
}
