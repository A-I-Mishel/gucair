'use client';
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { auth as fbAuth, db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/lib/auth-context";
import { calculateScores } from "@/lib/scoring";
import type { Question, PillarKey, AssessmentResponse } from "@/types";
import { PILLARS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Progress } from "@/components/ui/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toaster";

export default function AssessmentWizardPage() {
  const { universityId, user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: number; notes?: string; evidenceUrl?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "questions"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Question));
    })();
  }, []);

  // Auto-save draft every 30s
  useEffect(() => {
    const t = setInterval(() => {
      if (Object.keys(answers).length > 0) void saveDraft(true);
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const pillar = PILLARS[step];
  const pillarQuestions = questions.filter((x) => x.pillar === (pillar?.key as PillarKey));

  const setAnswer = (id: string, patch: { answer?: number; notes?: string; evidenceUrl?: string }) => {
    setAnswers((s) => ({ ...s, [id]: { answer: patch.answer ?? s[id]?.answer ?? 0, notes: patch.notes ?? s[id]?.notes, evidenceUrl: patch.evidenceUrl ?? s[id]?.evidenceUrl } }));
  };

  const uploadEvidence = async (file: File, questionId: string) => {
    // Cloudinary unsigned preset (folder gucair/evidence); falls back to URL paste.
    const url = await uploadToCloudinary(file, "gucair/evidence");
    setAnswer(questionId, { evidenceUrl: url });
  };

  const buildResponses = (): AssessmentResponse[] =>
    questions.map((x) => ({
      questionId: x.id,
      pillar: x.pillar,
      answer: answers[x.id]?.answer ?? 0,
      maxScore: x.maxScore,
      evidenceUrl: answers[x.id]?.evidenceUrl,
      notes: answers[x.id]?.notes,
    }));

  // Next version = max existing version + 1; links to latest for trend tracking.
  const nextVersion = async (): Promise<{ version: number; previousAssessmentId?: string }> => {
    const snap = await getDocs(
      query(collection(db, "assessments"), where("universityId", "==", universityId))
    );
    let maxV = 0;
    let latestId: string | undefined;
    snap.docs.forEach((d) => {
      const v = (d.data() as { version?: number }).version ?? 0;
      if (v > maxV) { maxV = v; latestId = d.id; }
    });
    return { version: maxV + 1, previousAssessmentId: latestId };
  };

  const saveDraft = async (silent = false) => {
    if (!universityId || !user) return;
    setSaving(true);
    try {
      const { version, previousAssessmentId } = await nextVersion();
      await addDoc(collection(db, "assessments"), {
        universityId,
        userId: user.uid,
        version,
        previousAssessmentId: previousAssessmentId ?? null,
        status: "draft",
        pillarScores: { research: 0, curriculum: 0, infrastructure: 0, ethics: 0, industry: 0 },
        overallScore: 0,
        responses: buildResponses(),
        submittedAt: null,
        createdAt: serverTimestamp(),
      });
      if (!silent) {
        setMsg(`Draft saved as v${version}.`);
        toast({ title: "Draft saved", description: `Version ${version}`, variant: "success" });
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : "Save failed";
      if (!silent) {
        setMsg(m);
        toast({ title: "Save failed", description: m, variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!universityId || !user) return;
    setSaving(true);
    try {
      // Client-side scoring (Spark plan: no Cloud Functions).
      const responses = buildResponses();
      const { pillarScores, overallScore } = calculateScores(responses, questions);
      const { version, previousAssessmentId } = await nextVersion();
      await addDoc(collection(db, "assessments"), {
        universityId,
        userId: user.uid,
        version,
        previousAssessmentId: previousAssessmentId ?? null,
        status: "submitted",
        pillarScores,
        overallScore,
        responses,
        submittedAt: serverTimestamp(),
      });
      setMsg(`v${version} submitted with overall score ${overallScore}. Refreshing rankings…`);
      toast({ title: "Submitted for review", description: `Overall score ${overallScore}`, variant: "success" });
      try {
        const token = await fbAuth.currentUser?.getIdToken();
        await fetch("/api/admin/recalculate", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
      } catch {
        // Recalculation is best-effort here; admins can trigger it from /admin/setup.
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : "Submit failed";
      setMsg(m);
      toast({ title: "Submit failed", description: m, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!pillar) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">AI Readiness Assessment</h1>
      <Progress value={((step + 1) / PILLARS.length) * 100} />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pillars">
        {PILLARS.map((p, i) => (
          <button key={p.key} role="tab" aria-selected={i === step} onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1 text-xs ${i === step ? "bg-[#1e3a5f] text-white" : "bg-slate-100"}`}>
            {i + 1}. {p.label}
          </button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{pillar.label} ({Math.round(pillar.weight * 100)}%)</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {pillarQuestions.length === 0 && <p className="text-sm text-slate-500">No questions loaded — create the framework in /admin/setup first.</p>}
          {pillarQuestions.map((x) => (
            <div key={x.id} className="rounded-lg border p-4">
              <Label htmlFor={x.id}>{x.text} (0–{x.maxScore})</Label>
              <p className="text-xs text-slate-500">{x.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Input id={x.id} type="number" min={0} max={x.maxScore} className="w-28"
                  value={answers[x.id]?.answer ?? 0}
                  onChange={(e) => setAnswer(x.id, { answer: Number(e.target.value) })} />
                <input type="file" aria-label={`Evidence for ${x.text}`}
                  onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { await uploadEvidence(f, x.id); } catch (err) { setMsg(err instanceof Error ? err.message : "Upload failed — paste a URL instead."); } } }} className="text-sm" />
                <Input placeholder="…or paste evidence URL" className="w-56" value={answers[x.id]?.evidenceUrl ?? ""}
                  onChange={(e) => setAnswer(x.id, { evidenceUrl: e.target.value })} aria-label={`Evidence URL for ${x.text}`} />
              </div>
              <Textarea placeholder="Notes (optional)" className="mt-2" value={answers[x.id]?.notes ?? ""}
                onChange={(e) => setAnswer(x.id, { notes: e.target.value })} />
              {answers[x.id]?.evidenceUrl && <p className="mt-1 text-xs text-green-600">Evidence attached ✓</p>}
            </div>
          ))}
          {msg && <p className="text-sm text-slate-600" role="status">{msg}</p>}
          <div className="flex flex-wrap gap-2">
            {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < PILLARS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>Next pillar</Button>
            ) : (
              <Button variant="accent" onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit for review"}</Button>
            )}
            <Button variant="ghost" onClick={() => saveDraft()} disabled={saving}>Save as draft</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
