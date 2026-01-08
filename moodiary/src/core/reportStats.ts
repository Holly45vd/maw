// src/core/reportStats.ts
import { EntrySession, MoodKey } from "./types";

export type ReportMode = "7d" | "30d";

export type ReportGate = {
  ok: boolean;
  requiredDays: number;
  requiredSessions: number;
  daysRecorded: number;
  totalSessions: number;
};

export type DistItem = { key: string; count: number; ratio: number };

export type DeltaType = "회복형" | "소모형" | "안정형" | "변동형";

/** 무드 8단계 순서(나쁨→좋음) */
export const MOOD_ORDER: MoodKey[] = [
  "very_bad",
  "sad",
  "anxious",
  "angry",
  "calm",
  "content",
  "good",
  "very_good",
];

/** 아이콘이 없어도 텍스트 라벨로 먼저 운영 가능 */
export const MOOD_LABEL_KO: Record<MoodKey, string> = {
  very_bad: "완전↓",
  sad: "다운",
  anxious: "불안",
  angry: "짜증",
  calm: "평온",
  content: "만족",
  good: "좋음",
  very_good: "최고↑",
};

export const MOOD_SCORE: Record<MoodKey, number> = {
  very_bad: 1,
  sad: 2,
  anxious: 3,
  angry: 4,
  calm: 5,
  content: 6,
  good: 7,
  very_good: 8,
};

export type ReportStatsV11 = {
  range?: { start: string; end: string; days: number; mode: ReportMode };

  gate: ReportGate;

  volume: {
    totalSessions: number;
    daysRecorded: number;
    completeDays: number; // morning+evening 둘 다 있는 날짜 수
  };

  energy: {
    morningAvg: number | null;
    eveningAvg: number | null;
    avgDailyDelta: number | null; // completeDays 기준 평균
    deltaType: DeltaType | null;
    deltaDays: { up: number; flat: number; down: number }; // 날짜 기준
  };

  mood: {
    order: MoodKey[];
    labelsKo: Record<MoodKey, string>;
    distribution: Record<MoodKey, number>; // 세션 기준 count
    top: DistItem[]; // Top2
    avgScore: number | null; // 세션 기준 평균(1~8)
  };

  topic: {
    distribution: Record<string, number>; // 토픽(tag) 기준 count
    top: DistItem[]; // Top2
  };
};

// ---------------- utils ----------------
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function safeAvg(nums: number[]) {
  if (nums.length === 0) return null;
  return round1(nums.reduce((a, n) => a + n, 0) / nums.length);
}

function buildDist(items: string[]): DistItem[] {
  const m = new Map<string, number>();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);

  const total = items.length || 1;
  return Array.from(m.entries())
    .map(([key, count]) => ({ key, count, ratio: count / total }))
    .sort((a, b) => b.count - a.count);
}

/**
 * ✅ topics[] 호환 레이어
 * - 신규 topics 있으면 그걸 우선
 * - 없으면 레거시 topic을 배열로 감싸서 반환
 */
function getTopics(s: EntrySession): string[] {
  if (Array.isArray((s as any).topics) && (s as any).topics.length > 0) {
    return (s as any).topics
      .map(String)
      .map((t: string) => t.trim())
      .filter(Boolean);
  }
  const legacy = typeof (s as any).topic === "string" ? (s as any).topic.trim() : "";
  return legacy ? [legacy] : [];
}

export function getGate(mode: ReportMode, sessions: EntrySession[]): ReportGate {
  const totalSessions = sessions.length;
  const daysRecorded = new Set(sessions.map((s) => s.date)).size;

  const requiredDays = mode === "7d" ? 3 : 7;
  const requiredSessions = mode === "7d" ? 4 : 10;

  const ok = daysRecorded >= requiredDays && totalSessions >= requiredSessions;
  return { ok, requiredDays, requiredSessions, daysRecorded, totalSessions };
}

function calcDeltaType(
  avgDailyDelta: number,
  deltaDays: { up: number; flat: number; down: number }
): DeltaType {
  if (avgDailyDelta > 0.5) return "회복형";
  if (avgDailyDelta < -0.5) return "소모형";
  if (Math.abs(avgDailyDelta) < 0.3) return "안정형";
  if (deltaDays.up > 0 && deltaDays.down > 0) return "변동형";
  return "변동형";
}

/** ✅ 메인 빌더 */
export function buildReportStatsV11(
  mode: ReportMode,
  sessions: EntrySession[],
  range?: { start: string; end: string; days: number }
): ReportStatsV11 {
  const gate = getGate(mode, sessions);

  const totalSessions = sessions.length;
  const daysRecorded = new Set(sessions.map((s) => s.date)).size;

  // energy 평균
  const morningEnergies = sessions.filter((s) => s.slot === "morning").map((s) => s.energy);
  const eveningEnergies = sessions.filter((s) => s.slot === "evening").map((s) => s.energy);

  const morningAvg = safeAvg(morningEnergies);
  const eveningAvg = safeAvg(eveningEnergies);

  // 날짜별 morning/evening 매핑 후 delta 계산(둘 다 있는 날만)
  const byDate: Record<string, { morning?: EntrySession; evening?: EntrySession }> = {};
  for (const s of sessions) {
    (byDate[s.date] ??= {})[s.slot] = s;
  }

  const deltas: number[] = [];
  let up = 0,
    flat = 0,
    down = 0;

  for (const v of Object.values(byDate)) {
    if (v.morning && v.evening) {
      const d = v.evening.energy - v.morning.energy;
      deltas.push(d);
      if (d > 0) up++;
      else if (d < 0) down++;
      else flat++;
    }
  }

  const completeDays = deltas.length;
  const avgDailyDelta = safeAvg(deltas);
  const deltaType =
    avgDailyDelta === null ? null : calcDeltaType(avgDailyDelta, { up, flat, down });

  // mood distribution + avg score
  const moodDist: Record<MoodKey, number> = {
    very_bad: 0,
    sad: 0,
    anxious: 0,
    angry: 0,
    calm: 0,
    content: 0,
    good: 0,
    very_good: 0,
  };
  const moodScores: number[] = [];
  for (const s of sessions) {
    moodDist[s.mood] = (moodDist[s.mood] ?? 0) + 1;
    moodScores.push(MOOD_SCORE[s.mood]);
  }
  const moodTop = buildDist(sessions.map((s) => s.mood)).slice(0, 2);

  // topic distribution (✅ topics[] 대응)
  const topicItems = sessions.flatMap(getTopics);
  const topicDistArr = buildDist(topicItems).slice(0, 2);

  const topicDistribution: Record<string, number> = {};
  for (const t of topicItems) topicDistribution[t] = (topicDistribution[t] ?? 0) + 1;

  return {
    range: range ? { ...range, mode } : undefined,
    gate,
    volume: { totalSessions, daysRecorded, completeDays },
    energy: {
      morningAvg,
      eveningAvg,
      avgDailyDelta,
      deltaType,
      deltaDays: { up, flat, down },
    },
    mood: {
      order: MOOD_ORDER,
      labelsKo: MOOD_LABEL_KO,
      distribution: moodDist,
      top: moodTop,
      avgScore: safeAvg(moodScores),
    },
    topic: {
      distribution: topicDistribution,
      top: topicDistArr,
    },
  };
}

/**
 * (레거시 호환) 기존 코드에서 buildReportStats를 쓰고 있으면 깨지지 않게 유지
 * - ReportScreen은 V11을 직접 쓰는 걸 권장
 */
export function buildReportStats(sessions: EntrySession[]) {
  return buildReportStatsV11("7d", sessions);
}
