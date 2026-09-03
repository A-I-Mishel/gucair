import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Stats } from "@/types";

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const docRef = doc(db, "stats", "singleton");
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) throw new Error("Stats not found");
      return snapshot.data() as Stats;
    },
    staleTime: 1000 * 60 * 5,
  });
};

/** Back-compat alias (old name). */
export const useGlobalStats = useStats;
