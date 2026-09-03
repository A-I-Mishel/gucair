import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedSlugs } from "@/lib/public-data";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article = null;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    article = null;
  }
  if (!article) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">{article.title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {article.excerpt}
        {article.publishedAtISO ? ` · ${new Date(article.publishedAtISO).toLocaleDateString()}` : ""}
      </p>
      {article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{t}</span>
          ))}
        </div>
      )}
      {/* Admin-authored HTML from the CMS editor. */}
      <div className="mt-6 space-y-4 text-slate-700 [&_a]:text-teal-700 [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#1e3a5f] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1e3a5f] [&_img]:rounded-xl [&_img]:my-4 [&_li]:ml-5 [&_p]:leading-relaxed [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
