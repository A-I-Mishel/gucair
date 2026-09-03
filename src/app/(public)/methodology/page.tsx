import { PILLARS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">Methodology</h1>
      <p className="mt-4 text-slate-600">
        Each assessment contains 22 questions across five pillars. Answers are normalized to 0–100
        per pillar using per-question weights, then combined into an overall score using pillar weights.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Pillar</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Questions</th><th className="px-4 py-3">Focus</th></tr>
          </thead>
          <tbody>
            {PILLARS.map((p) => (
              <tr key={p.key} className="border-t">
                <td className="px-4 py-3 font-medium">{p.label}</td>
                <td className="px-4 py-3">{Math.round(p.weight * 100)}%</td>
                <td className="px-4 py-3">{p.key === "research" || p.key === "curriculum" ? 5 : 4}</td>
                <td className="px-4 py-3 text-slate-600">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-8 text-xl font-bold">Scoring formula</h2>
      <Card className="mt-3"><CardContent className="p-5 text-sm text-slate-700">
        <p><strong>Pillar score</strong> = Σ(answer / maxScore × weight) / Σ(weight) × 100</p>
        <p className="mt-2"><strong>Overall</strong> = 0.25·Research + 0.25·Curriculum + 0.20·Infrastructure + 0.15·Ethics + 0.15·Industry</p>
        <p className="mt-2">Scores are computed server-side by the <code>calculateAssessmentScore</code> Cloud Function on submission, then validated by admins before publication.</p>
      </CardContent></Card>
    </div>
  );
}
