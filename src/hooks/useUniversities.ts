import { useQuery } from "@tanstack/react-query";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { University } from "@/types";

export const useUniversities = (max = 100) => {
  return useQuery({
    queryKey: ["universities", max],
    queryFn: async () => {
      const q = query(
        collection(db, "universities"),
        where("status", "==", "approved"),
        orderBy("score", "desc"),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as University);
    },
    staleTime: 1000 * 60 * 5,
  });
};
