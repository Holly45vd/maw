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

/** ISO Date 타입 (YYYY-MM-DD) */
type YYYY = `${number}${number}${number}${number}`;
type MM = `${number}${number}`;
type DD = `${number}${number}`;
export type ISODate = `${YYYY}-${MM}-${DD}`;

/**
 * ✅ 단일 식별자(표준)
 * 예: 2026-01-07_morning
 */
export type EntryId = `${ISODate}_${EntrySlot}`;

export type EntrySession = {
  date: ISODate; // YYYY-MM-DD
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
export function makeEntryId(date: ISODate, slot: EntrySlot): EntryId {
  return `${date}_${slot}` as EntryId;
}

/** entryId -> {date, slot} 파싱 */
export function parseEntryId(
  entryId: string
): { date: ISODate | null; slot: EntrySlot | null } {
  const [dateRaw, slotRaw] = entryId.split("_");

  const isDate =
    typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw);

  const isSlot = slotRaw === "morning" || slotRaw === "evening";

  return {
    date: isDate ? (dateRaw as ISODate) : null,
    slot: isSlot ? (slotRaw as EntrySlot) : null,
  };
}
