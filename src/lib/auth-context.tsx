'use client';
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Role } from "@/types";

interface AuthContextType {
  user: User | null;
  role: Role | null;
  universityId: string | null;
  loading: boolean;
  /** Force-refresh the ID token (call after an admin changes your role). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  universityId: null,
  loading: true,
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<Omit<AuthContextType, "refresh">>({
    user: null,
    role: null,
    universityId: null,
    loading: true,
  });

  const load = useCallback(async (user: User | null) => {
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult(true);
        const role = tokenResult.claims.role as Role | undefined;
        const universityId = tokenResult.claims.universityId as string | undefined;
        if (!role) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();
          setState({
            user,
            role: (userData?.role as Role) || "public",
            universityId: (userData?.universityId as string) || null,
            loading: false,
          });
        } else {
          setState({ user, role, universityId: universityId || null, loading: false });
        }
      } catch {
        setState({ user, role: "public", universityId: null, loading: false });
      }
    } else {
      setState({ user: null, role: null, universityId: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => void load(user));
    return unsubscribe;
  }, [load]);

  const refresh = useCallback(async () => {
    await load(auth.currentUser);
  }, [load]);

  return <AuthContext.Provider value={{ ...state, refresh }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
