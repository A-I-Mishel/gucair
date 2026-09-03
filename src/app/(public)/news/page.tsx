import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPublishedArticleMetas, type ArticleMeta } from "@/lib/public-data";

export const revalidate = 3600;

export default async function NewsPage() {
  let articles: ArticleMeta[] = [];
  try {
    articles = await getPublishedArticleMetas();
  } catch {
    articles = [];
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">News & insights</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle><Link href={`/news/${a.slug}`} className="hover:underline">{a.title}</Link></CardTitle>
              <CardDescription>{a.excerpt}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {a.publishedAtISO ? new Date(a.publishedAtISO).toLocaleDateString() : ""}
                </span>
                <Link href={`/news/${a.slug}`} className="text-teal-700 hover:underline">Read more →</Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {articles.length === 0 && <p className="text-sm text-slate-500">No articles published yet.</p>}
      </div>
    </div>
  );
}
