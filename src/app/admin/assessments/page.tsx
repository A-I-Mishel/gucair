'use client';
import { useAssessmentQueue } from "@/hooks/useAssessmentQueue";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function AdminAssessmentsPage() {
  const { assessments, loading } = useAssessmentQueue();

  const review = async (id: string, status: "validated" | "draft", reviewNotes?: string) => {
    await updateDoc(doc(db, "assessments", id), { status, reviewNotes: reviewNotes ?? "" });
  };

  if (loading) return <p className="text-sm text-slate-500">Loading queue…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Assessment review queue ({assessments.length})</h1>
      <div className="space-y-3">
        {assessments.map((a) => (
          <div key={a.id} className="rounded-xl border p-4">
            <p className="font-medium">{a.universityId} · v{a.version} · score {a.overallScore}</p>
            <p className="text-xs text-slate-500">{a.responses.length} responses · by {a.userId}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => review(a.id, "validated")}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => review(a.id, "draft", "Please add evidence.")}>Request revision</Button>
              <Button size="sm" variant="destructive" onClick={() => review(a.id, "draft", "Rejected: does not meet criteria.")}>Reject</Button>
            </div>
          </div>
        ))}
        {assessments.length === 0 && <p className="text-sm text-slate-500">Queue is empty.</p>}
      </div>
    </div>
  );
}
