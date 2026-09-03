import { ArticleCard } from "@/components/news/ArticleCard";
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
      <p className="mt-2 text-slate-600">Consortium announcements, framework explainers, and member spotlights.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
        {articles.length === 0 && <p className="text-sm text-slate-500">No articles published yet.</p>}
      </div>
    </div>
  );
}
