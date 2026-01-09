// src/firebase/diaryRepo.ts

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase";
import {
  EntrySession,
  EntrySlot,
  ISODate,
  EntryId,
  makeEntryId,
} from "../core/types";

/**
 * =========================
 * Firestore References
 * =========================
 */

/** users/{uid}/entries/{entryId} */
function entryDocRef(uid: string, entryId: EntryId) {
  return doc(db, "users", uid, "entries", entryId);
}

/**
 * =========================
 * Read
 * =========================
 */

/** (레거시) 날짜 + 슬롯으로 조회 → 내부에서 entryId로 변환 */
export async function getSession(
  uid: string,
  date: ISODate,
  slot: EntrySlot
): Promise<EntrySession | null> {
  const entryId = makeEntryId(date, slot);
  return getSessionById(uid, entryId);
}

/** ✅ entryId 직접 조회 (표준) */
export async function getSessionById(
  uid: string,
  entryId: EntryId
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
): Promise<EntryId> {
  const { date, slot } = input;
  const entryId = makeEntryId(date, slot);
  const ref = entryDocRef(uid, entryId);

  const now = serverTimestamp();
  const snap = await getDoc(ref);

  const payload: EntrySession = {
    ...input,
    createdAt: snap.exists() ? (snap.data() as any)?.createdAt : now,
    updatedAt: now,
  };

  await setDoc(ref, payload, { merge: true });
  return entryId;
}

/**
 * =========================
 * Delete
 * =========================
 */

/** ✅ entryId 기준 삭제 (표준) */
export async function deleteSessionById(
  uid: string,
  entryId: EntryId
): Promise<void> {
  await deleteDoc(entryDocRef(uid, entryId));
}

/** (레거시) date+slot 삭제 → 내부에서 entryId로 변환 */
export async function deleteSession(
  uid: string,
  date: ISODate,
  slot: EntrySlot
): Promise<void> {
  const entryId = makeEntryId(date, slot);
  await deleteSessionById(uid, entryId);
}

/**
 * =========================
 * List
 * =========================
 */

/**
 * 기간 조회: users/{uid}/entries
 * - date: "YYYY-MM-DD" 문자열 기반 (ISODate)
 */
export async function listSessionsByRange(
  uid: string,
  startDate: ISODate,
  endDate: ISODate
): Promise<EntrySession[]> {
  const col = collection(db, "users", uid, "entries");

  const qy = query(
    col,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );

  const snap = await getDocs(qy);
  return snap.docs.map((d) => d.data() as EntrySession);
}
