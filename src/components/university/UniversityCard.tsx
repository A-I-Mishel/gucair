import Link from "next/link";
import type { University } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { scoreColor, formatScore } from "@/lib/utils";
import { UniAvatar } from "./UniAvatar";

export function UniversityCard({ u, rank }: { u: University; rank?: number }) {
  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {u.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.logoUrl} alt={`${u.name} logo`} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <UniAvatar name={u.name} size={48} />
          )}
          <div className="min-w-0 flex-1">
            {typeof rank === "number" && <p className="text-xs font-bold text-teal-600">#{rank}</p>}
            <Link href={`/universities/${u.id}`} className="font-semibold text-[#1e3a5f] hover:underline">
              {u.name}
            </Link>
            <p className="text-sm text-slate-500">
              {u.city}, {u.country} · {u.region}
            </p>
          </div>
          <Badge className="text-white" >
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-white"
              style={{ background: scoreColor(u.score) }}
            >
              {formatScore(u.score)}
            </span>
          </Badge>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{u.type.replace("_", " ")}</span>
          <Link href={`/universities/${u.id}`} className="text-teal-700 hover:underline">
            View profile →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
