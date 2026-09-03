import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ArticleMeta } from "@/lib/public-data";

const GRADIENTS = [
  "from-[#1e3a5f] to-[#0f766e]",
  "from-[#0f766e] to-[#1e3a5f]",
  "from-[#334155] to-[#0d9488]",
];

function gradientFor(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 997;
  return GRADIENTS[h % GRADIENTS.length];
}

export function ArticleCard({ article }: { article: ArticleMeta }) {
  const tag = article.tags[0] ?? "News";
  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <div className={`flex h-28 items-end bg-gradient-to-br p-4 ${gradientFor(article.slug)}`} aria-hidden>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          {tag}
        </span>
      </div>
      <CardHeader>
        <CardTitle>
          <Link href={`/news/${article.slug}`} className="hover:underline">
            {article.title}
          </Link>
        </CardTitle>
        <CardDescription>{article.excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {article.publishedAtISO ? new Date(article.publishedAtISO).toLocaleDateString() : ""}
          </span>
          <Link href={`/news/${article.slug}`} className="text-teal-700 hover:underline">
            Read more →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
