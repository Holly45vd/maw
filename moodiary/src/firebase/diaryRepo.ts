// src/firebase/diaryRepo.ts

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where, orderBy,getDocs, 
} from "firebase/firestore";



import { db } from "./firebase";
import {
  EntrySession,
  EntrySlot,
  makeEntryId,
} from "../core/types";

/**
 * =========================
 * Firestore References
 * =========================
 */

/** users/{uid}/entries/{entryId} */
function entryDocRef(uid: string, entryId: string) {
  return doc(db, "users", uid, "entries", entryId);
}

/**
 * =========================
 * Read
 * =========================
 */

/** 날짜 + 슬롯으로 조회 */
export async function getSession(
  uid: string,
  date: string,
  slot: EntrySlot
): Promise<EntrySession | null> {
  const entryId = makeEntryId(date, slot);
  const snap = await getDoc(entryDocRef(uid, entryId));
  return snap.exists() ? (snap.data() as EntrySession) : null;
}

/** entryId 직접 조회 (디테일 페이지용) */
export async function getSessionById(
  uid: string,
  entryId: string
): Promise<EntrySession | null> {
  const snap = await getDoc(entryDocRef(uid, entryId));
  return snap.exists() ? (snap.data() as EntrySession) : null;
}

/**
 * =========================
 * Write
 * =========================
 */

/**
 * 세션 생성 or 업데이트 (idempotent)
 * - entryId = YYYY-MM-DD_slot
 * - createdAt은 최초 1회만
 */
export async function upsertSession(
  uid: string,
  input: Omit<EntrySession, "createdAt" | "updatedAt">
) {
  const { date, slot } = input;
  const entryId = makeEntryId(date, slot);
  const ref = entryDocRef(uid, entryId);

  const now = serverTimestamp();
  const snap = await getDoc(ref);

  const payload: EntrySession = {
    ...input,
    createdAt: snap.exists() ? snap.data()?.createdAt : now,
    updatedAt: now,
  };

  await setDoc(ref, payload, { merge: true });
}

/**
 * =========================
 * Delete
 * =========================
 */

/** entryId 기준 삭제 */
export async function deleteSessionById(
  uid: string,
  entryId: string
): Promise<void> {
  await deleteDoc(entryDocRef(uid, entryId));
}

/**
 * 기간 조회: users/{uid}/entries
 * - date: "YYYY-MM-DD" 문자열 기반
 */
export async function listSessionsByRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<EntrySession[]> {
  const col = collection(db, "users", uid, "entries");

  const q = query(
    col,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EntrySession);
}
