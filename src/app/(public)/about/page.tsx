import { Card, CardContent } from "@/components/ui/card";
import { PILLARS } from "@/types";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">About the consortium</h1>
      <p className="mt-4 text-slate-600">
        GUCAIR is a collaborative platform where universities worldwide assess, benchmark, and
        improve their AI readiness. Members complete a structured 22-question assessment across five
        pillars, receive validated scores, and compare progress with peers globally and regionally.
      </p>
      <h2 className="mt-10 text-xl font-bold text-[#1e3a5f]">Five-pillar framework</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {PILLARS.map((p) => (
          <Card key={p.key}>
            <CardContent className="p-5">
              <p className="font-semibold">{p.label} · {Math.round(p.weight * 100)}%</p>
              <p className="mt-1 text-sm text-slate-600">{p.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mt-10 text-xl font-bold text-[#1e3a5f]">How it works</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-slate-600">
        <li>Universities apply via the Join page; admins approve founding members.</li>
        <li>Representatives complete the assessment wizard with evidence uploads.</li>
        <li>Admins review, validate, and scores propagate to rankings automatically.</li>
        <li>Members benchmark against peers and export PDF reports.</li>
      </ol>
    </div>
  );
}
