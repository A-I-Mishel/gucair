'use client';
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { REGIONS } from "@/types";

async function adminPost(path: string, body: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function adminUpload(path: string, file: File) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

interface SeedResult {
  name: string;
  id?: string;
  country?: string;
  lat?: number;
  lng?: number;
  status: string;
  reason?: string;
}

export default function AdminSetupPage() {
  const [seedMsg, setSeedMsg] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [jsonMsg, setJsonMsg] = useState("");
  const [jsonSeeding, setJsonSeeding] = useState(false);
  const [jsonResults, setJsonResults] = useState<SeedResult[]>([]);
  const [csvMsg, setCsvMsg] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResults, setCsvResults] = useState<SeedResult[]>([]);
  const [m, setM] = useState({
    name: "", country: "", region: "Asia", city: "", lat: "", lng: "",
    website: "", type: "public", studentCount: "", facultyCount: "", year: "",
  });
  const [manualMsg, setManualMsg] = useState("");
  const [recalcMsg, setRecalcMsg] = useState("");

  const seedQuestions = async () => {
    setSeeding(true);
    setSeedMsg("");
    try {
      const data = await adminPost("/api/admin/seed-questions", {});
      setSeedMsg(
        data.created === 0
          ? `Framework already exists (${data.existing} questions).`
          : `${data.created} questions created (${data.existing} already existed).`
      );
    } catch (e) {
      setSeedMsg(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const seedJson = async () => {
    setJsonSeeding(true);
    setJsonMsg("");
    setJsonResults([]);
    try {
      const data = await adminPost("/api/admin/seed-json", {});
      setJsonResults(data.universities ?? []);
      setJsonMsg(`${data.created} universities created, ${data.skipped} skipped (already exist). Recommended: run Recalculate below.`);
    } catch (e) {
      setJsonMsg(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setJsonSeeding(false);
    }
  };

  const uploadCsv = async (f: File) => {
    setCsvUploading(true);
    setCsvMsg("");
    setCsvResults([]);
    try {
      const data = await adminUpload("/api/admin/upload-csv", f);
      setCsvResults(data.universities ?? []);
      setCsvMsg(`Created ${data.created}, failed ${data.failed}.`);
    } catch (e) {
      setCsvMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setCsvUploading(false);
    }
  };

  const manualAdd = async () => {
    setManualMsg("");
    try {
      const data = await adminPost("/api/admin/add-university", {
        name: m.name,
        country: m.country,
        region: m.region,
        city: m.city,
        lat: Number(m.lat),
        lng: Number(m.lng),
        website: m.website || null,
        type: m.type,
        studentCount: m.studentCount === "" ? null : Number(m.studentCount),
        facultyCount: m.facultyCount === "" ? null : Number(m.facultyCount),
        year: m.year === "" ? null : Number(m.year),
      });
      setManualMsg(`Added university (${data.id}).`);
      setM({ name: "", country: "", region: "Asia", city: "", lat: "", lng: "", website: "", type: "public", studentCount: "", facultyCount: "", year: "" });
    } catch (e) {
      setManualMsg(e instanceof Error ? e.message : "Add failed");
    }
  };

  const recalc = async () => {
    setRecalcMsg("Recalculating…");
    try {
      const data = await adminPost("/api/admin/recalculate", {});
      setRecalcMsg(`Done: ${data.ranked} ranked of ${data.approved} approved universities.`);
    } catch (e) {
      setRecalcMsg(e instanceof Error ? e.message : "Recalculate failed");
    }
  };

  const ResultTable = ({ rows }: { rows: SeedResult[] }) => (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2">
                {r.status === "failed"
                  ? <span className="text-red-600">failed: {r.reason}</span>
                  : <span className="text-green-600">{r.status}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Setup — real data onboarding</h1>

      <Card>
        <CardHeader>
          <CardTitle>Method 1: Auto-seed from JSON (recommended)</CardTitle>
          <CardDescription>Instantly create 16 real universities from the built-in dataset (data file, not code).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={seedJson} disabled={jsonSeeding}>{jsonSeeding ? "Seeding…" : "Seed Universities"}</Button>
          {jsonMsg && <p className="text-sm text-slate-600" role="status">{jsonMsg}</p>}
          {jsonResults.length > 0 && <ResultTable rows={jsonResults} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Method 2: Upload CSV</CardTitle>
          <CardDescription>Upload your own university list. Columns: name,country,region,city,lat,lng,website,type,studentCount,facultyCount,year</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100">
              {csvUploading ? "Uploading…" : "Choose CSV & Import"}
              <input type="file" accept=".csv" className="hidden" aria-label="Upload university CSV"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCsv(f); e.target.value = ""; }} />
            </label>
            <a href="/bulk-import-template.csv" download className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100">
              Download template CSV
            </a>
          </div>
          {csvMsg && <p className="text-sm text-slate-600" role="status">{csvMsg}</p>}
          {csvResults.length > 0 && <ResultTable rows={csvResults} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Method 3: Add one by one</CardTitle>
          <CardDescription>Manual form for one-off additions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label htmlFor="s-name">Name *</Label><Input id="s-name" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></div>
            <div><Label htmlFor="s-country">Country *</Label><Input id="s-country" value={m.country} onChange={(e) => setM({ ...m, country: e.target.value })} /></div>
            <div><Label htmlFor="s-city">City *</Label><Input id="s-city" value={m.city} onChange={(e) => setM({ ...m, city: e.target.value })} /></div>
            <div><Label htmlFor="s-region">Region *</Label>
              <select id="s-region" value={m.region} onChange={(e) => setM({ ...m, region: e.target.value })} className="w-full rounded-md border p-2 text-sm">
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><Label htmlFor="s-lat">Latitude *</Label><Input id="s-lat" inputMode="decimal" value={m.lat} onChange={(e) => setM({ ...m, lat: e.target.value })} /></div>
            <div><Label htmlFor="s-lng">Longitude *</Label><Input id="s-lng" inputMode="decimal" value={m.lng} onChange={(e) => setM({ ...m, lng: e.target.value })} /></div>
            <div><Label htmlFor="s-web">Website</Label><Input id="s-web" value={m.website} onChange={(e) => setM({ ...m, website: e.target.value })} placeholder="https://" /></div>
            <div><Label htmlFor="s-type">Type</Label>
              <select id="s-type" value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })} className="w-full rounded-md border p-2 text-sm">
                <option value="public">public</option><option value="private">private</option><option value="research_institute">research_institute</option>
              </select>
            </div>
            <div><Label htmlFor="s-stu">Students</Label><Input id="s-stu" inputMode="numeric" value={m.studentCount} onChange={(e) => setM({ ...m, studentCount: e.target.value })} /></div>
            <div><Label htmlFor="s-fac">Faculty</Label><Input id="s-fac" inputMode="numeric" value={m.facultyCount} onChange={(e) => setM({ ...m, facultyCount: e.target.value })} /></div>
            <div><Label htmlFor="s-year">Established year</Label><Input id="s-year" inputMode="numeric" value={m.year} onChange={(e) => setM({ ...m, year: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={manualAdd}>Add University</Button>
            {manualMsg && <p className="text-sm text-slate-600" role="status">{manualMsg}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment framework</CardTitle>
          <CardDescription>Create the 22 questions (idempotent — safe to run twice).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={seedQuestions} disabled={seeding}>{seeding ? "Creating…" : "Create Assessment Framework"}</Button>
          {seedMsg && <p className="text-sm text-slate-600" role="status">{seedMsg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recalculate rankings</CardTitle>
          <CardDescription>Rebuild stats + per-region rankings after seeding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="accent" onClick={recalc}>Recalculate Rankings</Button>
          {recalcMsg && <p className="text-sm text-slate-600" role="status">{recalcMsg}</p>}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="setup-notes">Progress notes</Label>
        <Textarea id="setup-notes" rows={3} placeholder="e.g. Seeded 16 from JSON on …; 2 CSV failures fixed manually…" aria-label="Setup progress notes" />
      </div>
    </div>
  );
}
