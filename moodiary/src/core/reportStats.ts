import { EntrySession } from "./types";

export type ReportMode = "7d" | "30d";

export type ReportGate = {
  ok: boolean;
  requiredDays: number;
  requiredSessions: number;
  daysRecorded: number;
  totalSessions: number;
};

export type ReportStats = {
  totalSessions: number;
  daysRecorded: number;

  morningAvgEnergy: number | null;
  eveningAvgEnergy: number | null;

  // morning+evening 둘 다 있는 날짜만 대상으로 계산
  avgDailyDelta: number | null;
  completeDays: number; // both slots exist

  moodTop: Array<{ key: string; count: number }>;
  topicTop: Array<{ key: string; count: number }>;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function getGate(mode: ReportMode, sessions: EntrySession[]): ReportGate {
  const totalSessions = sessions.length;
  const daysRecorded = new Set(sessions.map((s) => s.date)).size;

  const requiredDays = mode === "7d" ? 3 : 7;
  const requiredSessions = mode === "7d" ? 4 : 10;

  const ok = daysRecorded >= requiredDays && totalSessions >= requiredSessions;

  return { ok, requiredDays, requiredSessions, daysRecorded, totalSessions };
}

export function buildReportStats(sessions: EntrySession[]): ReportStats {
  const totalSessions = sessions.length;
  const daysRecorded = new Set(sessions.map((s) => s.date)).size;

  // energy 평균
  const mornings = sessions.filter((s) => s.slot === "morning");
  const evenings = sessions.filter((s) => s.slot === "evening");

  const morningAvgEnergy =
    mornings.length > 0
      ? round1(mornings.reduce((a, s) => a + (s.energy ?? 0), 0) / mornings.length)
      : null;

  const eveningAvgEnergy =
    evenings.length > 0
      ? round1(evenings.reduce((a, s) => a + (s.energy ?? 0), 0) / evenings.length)
      : null;

  // 날짜별 morning/evening 매핑 후 delta 계산 (둘 다 있는 날만)
  const byDate: Record<string, { morning?: EntrySession; evening?: EntrySession }> =
    {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = {};
    byDate[s.date][s.slot] = s;
  }

  const deltas: number[] = [];
  Object.values(byDate).forEach((v) => {
    if (v.morning && v.evening) {
      deltas.push((v.evening.energy ?? 0) - (v.morning.energy ?? 0));
    }
  });

  const completeDays = deltas.length;
  const avgDailyDelta =
    completeDays > 0 ? round1(deltas.reduce((a, n) => a + n, 0) / completeDays) : null;

  // 분포 Top3
  const countTop = (items: string[]) => {
    const m = new Map<string, number>();
    items.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
    return Array.from(m.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const moodTop = countTop(sessions.map((s) => String(s.mood ?? "")));
  const topicTop = countTop(sessions.map((s) => String(s.topic ?? "")));

  return {
    totalSessions,
    daysRecorded,
    morningAvgEnergy,
    eveningAvgEnergy,
    avgDailyDelta,
    completeDays,
    moodTop,
    topicTop,
  };
}
