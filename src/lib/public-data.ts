import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Article } from "@/types";

/** Server-side (SSG/ISR) data access — only touches publicly-readable collections. */

export interface ArticleMeta {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  imageUrl: string | null;
  publishedAtISO: string | null;
}

function toMeta(id: string, a: Article): ArticleMeta {
  return {
    id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    tags: a.tags ?? [],
    imageUrl: a.imageUrl ?? null,
    publishedAtISO: a.publishedAt ? a.publishedAt.toDate().toISOString() : null,
  };
}

export async function getPublishedArticleMetas(max = 20): Promise<ArticleMeta[]> {
  const q = query(
    collection(db, "articles"),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toMeta(d.id, d.data() as Article));
}

export async function getPublishedSlugs(): Promise<string[]> {
  const metas = await getPublishedArticleMetas(50);
  return metas.map((m) => m.slug);
}

export async function getArticleBySlug(slug: string): Promise<(ArticleMeta & { content: string }) | null> {
  const q = query(collection(db, "articles"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const a = d.data() as Article;
  if (a.status !== "published") return null;
  return { ...toMeta(d.id, a), content: a.content };
}

export async function getApprovedUniversityIds(): Promise<string[]> {
  const q = query(collection(db, "universities"), where("status", "==", "approved"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}
