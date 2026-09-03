import { RoleGuard } from "@/components/RoleGuard";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="rep">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1 rounded-xl border p-3 text-sm" aria-label="Dashboard navigation">
          <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">University</p>
          <Nav href="/dashboard" label="Overview" />
          <Nav href="/dashboard/assessment" label="Assessment wizard" />
          <Nav href="/dashboard/benchmark" label="Peer benchmarking" />
        </aside>
        <div>{children}</div>
      </div>
    </RoleGuard>
  );
}

function Nav({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="block rounded-md px-3 py-2 hover:bg-slate-100">{label}</Link>;
}
