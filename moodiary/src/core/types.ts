// src/core/types.ts

export type EntrySlot = "morning" | "evening";

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type MoodKey =
  | "very_bad"
  | "sad"
  | "anxious"
  | "angry"
  | "calm"
  | "content"
  | "good"
  | "very_good";

/**
 * 핵심 도메인: 하루의 한 세션 (아침 or 저녁)
 */
export type EntrySession = {
  date: string; // YYYY-MM-DD (로컬 기준)
  slot: EntrySlot;

  mood: MoodKey;
  energy: EnergyLevel;
  topic: string;
  note?: string;

  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
};

/**
 * entryId 규칙 (중복 방지 핵심)
 * 예: 2026-01-07_morning
 */
export function makeEntryId(date: string, slot: EntrySlot) {
  return `${date}_${slot}`;
}
