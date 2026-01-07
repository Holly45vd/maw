import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export type UserSettings = {
  version: 1;
  showQuote: boolean;
  defaultTab: "home" | "calendar" | "report" | "profile";
  reminderEnabled?: boolean; // Phase 2
};

export type UserDoc = {
  uid: string;
  email?: string | null;
  displayName?: string;
  createdAt: any;
  updatedAt: any;
  settings: UserSettings;
};

function userRef(uid: string) {
  return doc(db, "users", uid);
}

export async function ensureUserDoc(uid: string, email?: string | null, displayName?: string) {
  const ref = userRef(uid);
  const snap = await getDoc(ref);

  const now = serverTimestamp();

  if (!snap.exists()) {
    const payload: UserDoc = {
      uid,
      email: email ?? null,
      displayName: displayName ?? "",
      createdAt: now,
      updatedAt: now,
      settings: {
        version: 1,
        showQuote: true,
        defaultTab: "home",
        reminderEnabled: false,
      },
    };
    await setDoc(ref, payload, { merge: true });
    return payload;
  }

  // 존재하면 updatedAt만 갱신하진 않음(불필요한 writes 방지)
  return snap.data() as UserDoc;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

export async function updateUserProfile(uid: string, patch: Partial<Pick<UserDoc, "displayName">>) {
  await updateDoc(userRef(uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserSettings(uid: string, patch: Partial<UserSettings>) {
  await updateDoc(userRef(uid), {
    "settings.version": 1,
    ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [`settings.${k}`, v])),
    updatedAt: serverTimestamp(),
  });
}
