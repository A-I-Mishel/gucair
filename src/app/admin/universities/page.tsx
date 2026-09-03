'use client';
import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { University } from "@/types";
import { REGIONS } from "@/types";
import { Button } from "@/components/ui/button";

interface ImportRow {
  name: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  website: string;
  type: string;
  studentCount: number | null;
  facultyCount: number | null;
  year: number | null;
  contactEmail: string;
  error?: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur = [""];
  let inQuotes = false;
  const pushRow = () => { rows.push(cur); cur = [""]; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
        else inQuotes = false;
      } else cur[cur.length - 1] += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") cur.push("");
    else if (c === "\n") pushRow();
    else if (c === "\r") { /* skip */ }
    else cur[cur.length - 1] += c;
  }
  if (cur.length > 1 || cur[0] !== "") pushRow();
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export default function AdminUniversitiesPage() {
  const [rows, setRows] = useState<University[]>([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const snap = await getDocs(collection(db, "universities"));
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as University));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: University["status"]) => {
    await updateDoc(doc(db, "universities", id), { status });
    load();
  };

  const exportCSV = () => {
    const header = "id,name,country,region,city,score,status";
    const lines = rows.map((r) => [r.id, `"${r.name}"`, r.country, r.region, r.city, r.score ?? "", r.status].join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gucair-universities.csv";
    a.click();
  };

  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);

  const onFile = async (f: File) => {
    setImportMsg("");
    const text = await f.text();
    const grid = parseCSV(text);
    if (grid.length < 2) { setImportMsg("CSV is empty or missing a header row."); return; }
    const header = grid[0].map((h) => h.trim());
    const idx = (name: string) => header.indexOf(name);
    const required = ["name", "country", "region", "city"];
    for (const r of required) {
      if (idx(r) < 0) { setImportMsg(`Missing required column: ${r}`); return; }
    }
    const existing = new Set(rows.map((u) => `${u.name.toLowerCase()}|${u.country.toLowerCase()}`));
    const seen = new Set<string>();
    const parsed: ImportRow[] = grid.slice(1).map((cells) => {
      const get = (n: string) => (idx(n) >= 0 ? (cells[idx(n)] ?? "").trim() : "");
      const row: ImportRow = {
        name: get("name"),
        country: get("country"),
        region: get("region"),
        city: get("city"),
        lat: Number(get("lat") || 0),
        lng: Number(get("lng") || 0),
        website: get("website"),
        type: get("type") || "public",
        studentCount: get("studentCount") ? Number(get("studentCount")) : null,
        facultyCount: get("facultyCount") ? Number(get("facultyCount")) : null,
        year: get("year") ? Number(get("year")) : null,
        contactEmail: get("contactEmail"),
      };
      const key = `${row.name.toLowerCase()}|${row.country.toLowerCase()}`;
      if (!row.name || !row.country || !row.city) row.error = "Missing required field (name/country/city).";
      else if (!REGIONS.includes(row.region as (typeof REGIONS)[number])) row.error = `Invalid region (must be one of: ${REGIONS.join(", ")}).`;
      else if (Number.isNaN(row.lat) || Number.isNaN(row.lng)) row.error = "Invalid coordinates.";
      else if (existing.has(key) || seen.has(key)) row.error = "Duplicate (name + country already exists).";
      seen.add(key);
      return row;
    });
    setPreview(parsed);
  };

  const runImport = async () => {
    const valid = preview.filter((r) => !r.error);
    if (valid.length === 0) { setImportMsg("Nothing valid to import."); return; }
    setImporting(true);
    try {
      for (const r of valid) {
        await addDoc(collection(db, "universities"), {
          name: r.name,
          country: r.country,
          region: r.region,
          city: r.city,
          lat: r.lat,
          lng: r.lng,
          logoUrl: null,
          website: r.website || null,
          type: ["public", "private", "research_institute"].includes(r.type) ? r.type : "public",
          studentCount: r.studentCount,
          facultyCount: r.facultyCount,
          year: r.year,
          contactEmail: r.contactEmail,
          status: "approved",
          representatives: [],
          score: null,
          pillarScores: null,
          assessmentCount: 0,
          lastAssessmentAt: null,
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setImportMsg(`Imported ${valid.length} universities as approved. Invitation emails to contactEmail are a manual step (see README).`);
      setPreview([]);
      load();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const filtered = rows.filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Universities</h1>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100">
            Import CSV
            <input type="file" accept=".csv" className="hidden" aria-label="Upload CSV for bulk import"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          </label>
          <a href="/bulk-import-template.csv" download className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100">
            Template
          </a>
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>
      {importMsg && <p className="text-sm text-slate-600" role="status">{importMsg}</p>}
      {preview.length > 0 && (
        <div className="rounded-xl border p-4">
          <p className="text-sm font-semibold">Preview: {preview.filter((r) => !r.error).length} valid, {preview.filter((r) => r.error).length} with errors</p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {preview.map((r, i) => (
              <li key={i} className={r.error ? "text-red-600" : "text-slate-700"}>
                {r.name || "(unnamed)"} — {r.country} {r.error ? `· ${r.error}` : "· OK"}
              </li>
            ))}
          </ul>
          <Button className="mt-3" disabled={importing} onClick={runImport}>
            {importing ? "Importing…" : `Confirm import (${preview.filter((r) => !r.error).length})`}
          </Button>
        </div>
      )}
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border p-2 text-sm" aria-label="Filter by status">
        <option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option>
      </select>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Country</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">{r.country}</td>
                <td className="px-3 py-2">{r.score ?? "—"}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 space-x-1">
                  <Button size="sm" onClick={() => setStatus(r.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "suspended")}>Suspend</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
