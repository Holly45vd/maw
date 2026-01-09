// /workspaces/maw/moodiary/src/firebase/userRepo.ts
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
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

  /**
   * ✅ 사용자 커스텀 토픽 프리셋
   * - EntryScreen에서 새 토픽 추가 시 여기에 저장
   */
  topicPresets?: string[];
};

function userRef(uid: string) {
  return doc(db, "users", uid);
}

/**
 * users/{uid} 문서가 없으면 생성
 * - writes 최소화: 이미 있으면 그대로 반환
 */
export async function ensureUserDoc(uid: string, email?: string | null, displayName?: string) {
  const snap = await getDoc(userRef(uid));

  if (!snap.exists()) {
    const now = serverTimestamp();
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
      },
      topicPresets: [],
    };

    await setDoc(userRef(uid), payload, { merge: true });
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

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserDoc, "displayName">>
) {
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

/**
 * ✅ 커스텀 토픽 프리셋 추가
 * - 문서가 없어도 merge로 안전하게 생성됨
 * - 중복은 arrayUnion이 알아서 방지
 */
export async function addTopicPreset(uid: string, topic: string) {
  const t = String(topic ?? "").trim();
  if (!t) return;

  await setDoc(
    userRef(uid),
    {
      topicPresets: arrayUnion(t),
      updatedAt: serverTimestamp(),
      // settings.version 등은 건드릴 필요 없음
    },
    { merge: true }
  );
}

/**
 * ✅ 커스텀 토픽 프리셋 제거(옵션)
 * - UI에서 프리셋 관리 화면 만들 때 사용
 */
export async function removeTopicPreset(uid: string, topic: string) {
  const t = String(topic ?? "").trim();
  if (!t) return;

  await setDoc(
    userRef(uid),
    {
      topicPresets: arrayRemove(t),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
