import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

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
