'use client';
import { useStats } from "@/hooks/useGlobalStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useState } from "react";

export default function AdminOverviewPage() {
  const { data } = useStats();
  const [msg, setMsg] = useState("");

  const recalc = async () => {
    setMsg("Recalculating…");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/admin/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Failed: ${res.status}`);
      setMsg(`Done: ${body.ranked} ranked of ${body.approved} approved.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Admin overview</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total universities</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data?.totalUniversities ?? "—"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total assessments</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data?.totalAssessments ?? "—"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Avg. score</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data?.avgScore ?? "—"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>System</CardTitle></CardHeader><CardContent><Button onClick={recalc}>Recalculate rankings</Button>{msg && <p className="mt-2 text-xs" role="status">{msg}</p>}</CardContent></Card>
      </div>
    </div>
  );
}
