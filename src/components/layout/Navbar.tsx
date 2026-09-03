'use client';
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, role } = useAuth();
  const home = role === "admin" ? "/admin" : role === "rep" ? "/dashboard" : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-bold text-[#1e3a5f]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f] text-teal-300">G</span>
          GUCAIR
        </Link>
        <div className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/about" className="hover:text-teal-600">About</Link>
          <Link href="/methodology" className="hover:text-teal-600">Methodology</Link>
          <Link href="/rankings" className="hover:text-teal-600">Rankings</Link>
          <Link href="/universities" className="hover:text-teal-600">Universities</Link>
          <Link href="/news" className="hover:text-teal-600">News</Link>
          <Link href="/contact" className="hover:text-teal-600">Join</Link>
          {role === "rep" && <Link href="/dashboard" className="hover:text-teal-600">Dashboard</Link>}
          {role === "admin" && <Link href="/admin" className="hover:text-teal-600">Admin</Link>}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={home} className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white hover:bg-[#152a45]">
                {role === "admin" ? "Admin" : role === "rep" ? "Dashboard" : "Home"}
              </Link>
              <button onClick={() => void signOut(auth)} className="rounded-md px-3 py-2 text-sm hover:bg-slate-100" aria-label="Sign out">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100">Sign in</Link>
              <Link href="/register" className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white hover:bg-[#152a45]">
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-bold text-[#1e3a5f]">GUCAIR</p>
          <p className="mt-2 text-sm text-slate-600">Global University Consortium of AI Readiness. Benchmarking AI readiness across five pillars.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explore</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li><Link href="/rankings">Rankings</Link></li>
            <li><Link href="/universities">Directory</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Consortium</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/news">News</Link></li>
            <li><Link href="/contact">Join us</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Access</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="/dashboard">University dashboard</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} GUCAIR Consortium. All rights reserved.
      </div>
    </footer>
  );
}
