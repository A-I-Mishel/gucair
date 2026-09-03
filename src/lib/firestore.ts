import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Article } from "@/types";

export async function getPublishedArticles(max = 20): Promise<Article[]> {
  const q = query(
    collection(db, "articles"),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Article);
}

export async function submitJoinApplication(data: {
  name: string;
  country: string;
  region: string;
  city: string;
  website: string;
  contactEmail: string;
  message: string;
}) {
  return addDoc(collection(db, "universities"), {
    ...data,
    lat: 0,
    lng: 0,
    logoUrl: null,
    type: "public",
    studentCount: null,
    facultyCount: null,
    year: null,
    status: "pending",
    representatives: [],
    score: null,
    pillarScores: null,
    assessmentCount: 0,
    lastAssessmentAt: null,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    contactEmail: data.contactEmail,
    applicationMessage: data.message,
  });
}
