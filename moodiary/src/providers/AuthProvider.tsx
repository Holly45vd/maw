import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { ensureUserDoc } from "../firebase/userRepo";

type AuthCtx = {
  user: User | null;
  initializing: boolean;
};

const Ctx = createContext<AuthCtx>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setInitializing(false);

      if (u?.uid) {
        // ✅ users/{uid} 문서 보장
        await ensureUserDoc(u.uid, u.email, u.displayName ?? "");
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => ({ user, initializing }), [user, initializing]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
