'use client';
import { useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
  { href: "/rankings", label: "Rankings" },
  { href: "/universities", label: "Universities" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Join" },
];

export function Navbar() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const home = role === "admin" ? "/admin" : role === "rep" ? "/dashboard" : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-bold text-[#1e3a5f]" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f] text-teal-300">G</span>
          GUCAIR
        </Link>
        <div className="hidden items-center gap-6 text-sm md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-teal-600">{l.label}</Link>
          ))}
          {role === "rep" && <Link href="/dashboard" className="hover:text-teal-600">Dashboard</Link>}
          {role === "admin" && <Link href="/admin" className="hover:text-teal-600">Admin</Link>}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={home} className="hidden rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white hover:bg-[#152a45] sm:inline-block">
                {role === "admin" ? "Admin" : role === "rep" ? "Dashboard" : "Home"}
              </Link>
              <button onClick={() => void signOut(auth)} className="hidden rounded-md px-3 py-2 text-sm hover:bg-slate-100 sm:inline-block" aria-label="Sign out">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm hover:bg-slate-100 sm:inline-block">Sign in</Link>
              <Link href="/register" className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white hover:bg-[#152a45]">
                Join
              </Link>
            </>
          )}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span aria-hidden className="relative block h-4 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-slate-800 transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-slate-800 ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-[14px] h-0.5 w-5 bg-slate-800 transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <ul className="space-y-1 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-slate-100">{l.label}</Link>
              </li>
            ))}
            {role === "rep" && <li><Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-slate-100">Dashboard</Link></li>}
            {role === "admin" && <li><Link href="/admin" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-slate-100">Admin</Link></li>}
            <li className="border-t border-slate-100 pt-2">
              {user ? (
                <button onClick={() => { setOpen(false); void signOut(auth); }} className="block w-full rounded-md px-3 py-2 text-left hover:bg-slate-100">
                  Sign out{user.email ? ` (${user.email})` : ""}
                </button>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-slate-100">Sign in</Link>
              )}
            </li>
          </ul>
        </div>
      )}
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
