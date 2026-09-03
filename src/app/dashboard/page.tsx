'use client';
import { useAuth } from "@/lib/auth-context";
import { useAssessments } from "@/hooks/useAssessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendLine } from "@/components/charts/ScoreCharts";
import Link from "next/link";

export default function DashboardPage() {
  const { universityId, user } = useAuth();
  const { data } = useAssessments(universityId ?? undefined);
  const trend = (data ?? []).map((a) => ({ version: a.version, score: a.overallScore }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">University overview</h1>
      <p className="text-sm text-slate-600">Signed in as {user?.email} {universityId ? `· University: ${universityId}` : "· no university linked yet"}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Assessments</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Latest score</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data?.length ? data[data.length - 1].overallScore : "—"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data?.length ? data[data.length - 1].status : "—"}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Score trend</CardTitle></CardHeader><CardContent>
        {trend.length > 0 ? <TrendLine points={trend} /> : <p className="text-sm text-slate-500">No assessments yet. <Link href="/dashboard/assessment" className="text-teal-700 underline">Start your first assessment</Link>.</p>}
      </CardContent></Card>
    </div>
  );
}
