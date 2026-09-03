'use client';
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RoleGuard({ children, role }: { children: ReactNode; role?: "rep" | "admin" }) {
  const { user, role: userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (role && userRole !== role))) router.push("/login");
  }, [loading, user, userRole, role, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center" role="status">Loading...</div>;
  if (!user || (role && userRole !== role)) return null;
  return <>{children}</>;
}
