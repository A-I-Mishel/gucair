'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitJoinApplication } from "@/lib/firestore";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toaster";
import { REGIONS } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  region: z.string().min(2),
  city: z.string().min(1),
  website: z.string().url(),
  contactEmail: z.string().email(),
  message: z.string().min(10),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { toast } = useToast();
  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await submitJoinApplication(data);
      setDone(true);
      toast({ title: "Application received", description: "Our admins will review and contact you.", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submission failed";
      setError(msg);
      toast({ title: "Submission failed", description: msg, variant: "error" });
    }
  };

  if (done) return <div className="mx-auto max-w-xl px-4 py-14"><h1 className="text-2xl font-bold text-[#1e3a5f]">Application received</h1><p className="mt-2 text-slate-600">Our admins will review your application and contact you.</p></div>;

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">Join the consortium</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div><Label htmlFor="name">University name</Label><Input id="name" {...register("name")} />{errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label htmlFor="country">Country</Label><Input id="country" {...register("country")} />{errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}</div>
          <div><Label htmlFor="city">City</Label><Input id="city" {...register("city")} /></div>
        </div>
        <div><Label htmlFor="region">Region</Label>
          <select id="region" {...register("region")} className="w-full rounded-md border p-2 text-sm">
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><Label htmlFor="website">Website</Label><Input id="website" {...register("website")} placeholder="https://" />{errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}</div>
        <div><Label htmlFor="contactEmail">Contact email</Label><Input id="contactEmail" type="email" {...register("contactEmail")} />{errors.contactEmail && <p className="text-xs text-red-500">{errors.contactEmail.message}</p>}</div>
        <div><Label htmlFor="message">Message</Label><Textarea id="message" {...register("message")} />{errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}</div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit application"}</Button>
      </form>
    </div>
  );
}
