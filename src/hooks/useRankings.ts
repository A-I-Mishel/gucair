import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RegionRanking } from "@/types";

export const useRankings = (region = "global") => {
  return useQuery({
    queryKey: ["rankings", region],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "rankings", region));
      if (!snap.exists()) return null;
      return snap.data() as RegionRanking;
    },
    staleTime: 1000 * 60 * 10,
  });
};
