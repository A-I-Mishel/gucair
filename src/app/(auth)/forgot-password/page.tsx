'use client';
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Reset password</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <Button className="w-full" onClick={async () => { await sendPasswordResetEmail(auth, email); setMsg("Reset link sent. Check your inbox."); }}>Send reset link</Button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </CardContent>
    </Card>
  );
}
