import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Assessment } from "@/types";

export const useAssessmentQueue = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "assessments"), where("status", "==", "submitted"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAssessments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Assessment));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  return { assessments, loading };
};
