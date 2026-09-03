'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (fn: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      const u = auth.currentUser;
      if (u) {
        // Ensure a /users doc exists (Google first-timers skip /register).
        const ref = doc(db, "users", u.uid);
        const existing = await getDoc(ref).catch(() => null);
        if (!existing?.exists()) {
          await setDoc(ref, {
            email: u.email ?? "",
            name: u.displayName ?? (u.email ?? "User"),
            role: "public",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          }).catch(() => {});
        }
      }
      // Role-aware landing: admins → /admin, reps → /dashboard, public → /.
      let dest = "/";
      try {
        const u = auth.currentUser;
        if (u) {
          const claims = (await u.getIdTokenResult(true)).claims as { role?: string };
          let role = claims.role;
          if (!role) {
            const snap = await getDoc(doc(db, "users", u.uid));
            role = (snap.data() as { role?: string } | undefined)?.role;
          }
          dest = role === "admin" ? "/admin" : role === "rep" ? "/dashboard" : "/";
        }
      } catch {
        dest = "/";
      }
      router.push(dest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Sign in to GUCAIR</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
        <Button className="w-full" disabled={busy} onClick={() => login(() => signInWithEmailAndPassword(auth, email, password))}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <Button variant="outline" className="w-full" disabled={busy} onClick={() => login(() => signInWithPopup(auth, googleProvider))}>
          Continue with Google
        </Button>
        <div className="flex justify-between text-sm">
          <Link href="/register" className="text-teal-700 hover:underline">Create account</Link>
          <Link href="/forgot-password" className="text-teal-700 hover:underline">Forgot password?</Link>
        </div>
      </CardContent>
    </Card>
  );
}
