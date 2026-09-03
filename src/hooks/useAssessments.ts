import { useQuery } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Assessment } from "@/types";

export const useAssessments = (universityId?: string) => {
  return useQuery({
    queryKey: ["assessments", universityId],
    queryFn: async () => {
      const q = query(
        collection(db, "assessments"),
        where("universityId", "==", universityId),
        orderBy("version", "asc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Assessment);
    },
    enabled: !!universityId,
  });
};
