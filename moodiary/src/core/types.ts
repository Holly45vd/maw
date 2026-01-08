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

export type EntrySession = {
  date: string; // YYYY-MM-DD
  slot: EntrySlot;

  mood: MoodKey;
  energy: EnergyLevel;

  /**
   * ✅ v2: 복수 선택 토픽(권장)
   * - UI가 아직 단일 선택이어도 저장 시 topics: [topic] 형태로 넣어두면 호환 쉬움
   */
  topics?: string[];

  /**
   * ✅ v1 레거시(당장 삭제 금지)
   * - 기존 데이터/화면 호환 유지용
   */
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
