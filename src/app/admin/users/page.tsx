'use client';
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AppUser[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      setRows(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser));
    })();
  }, []);

  const [msg, setMsg] = useState("");

  const setRole = async (uid: string, role: "public" | "rep" | "admin", universityId?: string) => {
    setMsg("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, role, universityId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed: ${res.status}`);
      setMsg(`Role updated for ${uid}. They must sign out/in to refresh claims.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    }
  };

  const filtered = rows.filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Users</h1>
      <Input placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" className="max-w-sm" />
      {msg && <p className="text-sm text-slate-600" role="status">{msg}</p>}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">University</th><th className="px-3 py-2">Actions</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.uid} className="border-t">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.role}</td>
                <td className="px-3 py-2">{r.universityId ?? "—"}</td>
                <td className="px-3 py-2 space-x-1">
                  <Button size="sm" onClick={() => setRole(r.uid, "admin")}>Make admin</Button>
                  <Button size="sm" variant="outline" onClick={() => setRole(r.uid, "rep", r.universityId)}>Make rep</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
