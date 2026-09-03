import { RoleGuard } from "@/components/RoleGuard";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1 rounded-xl border p-3 text-sm" aria-label="Admin navigation">
          <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Admin</p>
          {[
            ["/admin", "Overview"],
            ["/admin/setup", "Setup"],
            ["/admin/universities", "Universities"],
            ["/admin/assessments", "Assessments"],
            ["/admin/users", "Users"],
            ["/admin/articles", "Articles"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="block rounded-md px-3 py-2 hover:bg-slate-100">{label}</Link>
          ))}
        </aside>
        <div>{children}</div>
      </div>
    </RoleGuard>
  );
}
