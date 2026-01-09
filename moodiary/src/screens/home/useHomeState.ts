import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { router } from "expo-router";

import { useAuth } from "../../providers/AuthProvider";
import { useUserDoc } from "../../query/useUserDoc";
import { useTodaySessions } from "../../query/useTodaySessions";
import { buildDailyInsight } from "../../core/insight";

import type { EntrySession } from "../../core/types";

type DayItem = {
  date: string;
  dow: string;
  dayNum: number;
  isToday: boolean;
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function cleanTopics(input: unknown): string[] {
  if (Array.isArray(input)) {
    const cleaned = input.map((t) => String(t ?? "").trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }
  return [];
}

export function getTopicsFromSession(s: any): string[] {
  const topics = cleanTopics(s?.topics);
  if (topics.length > 0) return topics;

  const legacy = typeof s?.topic === "string" ? s.topic.trim() : "";
  return legacy ? [legacy] : [];
}

export function useHomeState() {
  const { user } = useAuth();
  const { data: userDoc } = useUserDoc(user?.uid ?? null);

  const nickname =
    (userDoc?.displayName ?? user?.displayName ?? "나").trim() || "나";

  const todayId = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayId);
  const [energyMode, setEnergyMode] = useState<"morning" | "evening">("evening");

  const week = useMemo<DayItem[]>(() => {
    const end = dayjs(todayId);
    const start = end.subtract(4, "day");
    return Array.from({ length: ㅏ }).map((_, i) => {
      const d = start.add(i, "day");
      return {
        date: d.format("YYYY-MM-DD"),
        dow: DOW[d.day()],
        dayNum: d.date(),
        isToday: d.format("YYYY-MM-DD") === todayId,
      };
    });
  }, [todayId]);

  const { data, isLoading } = useTodaySessions(user?.uid ?? null, selectedDate);
  const morning: EntrySession | null = (data?.morning ?? null) as any;
  const evening: EntrySession | null = (data?.evening ?? null) as any;

  const status =
    morning && evening ? "full" : morning || evening ? "half" : "empty";

  const insight = useMemo(
    () => buildDailyInsight({ morning, evening }),
    [morning, evening]
  );

  const goEntry = (slot: "morning" | "evening") => {
    router.push({
      pathname: "/entry",
      params: { date: selectedDate, slot },
    });
  };

  const goDetail = (slot: "morning" | "evening") => {
    router.push({
      pathname: "/entry-detail",
      params: { entryId: `${selectedDate}_${slot}` },
    });
  };

  const goProfile = () => router.push("/profile");
  const goCalendar = (extra?: Record<string, any>) =>
    router.push({ pathname: "/calendar", params: { ...extra } });

  const openTopicInCalendar = (topic: string) => {
    const t = (topic ?? "").trim();
    if (!t) return;
    goCalendar({ focusTopic: t, date: selectedDate });
  };

  const morningTopics = useMemo(
    () => (morning ? getTopicsFromSession(morning) : []),
    [morning]
  );
  const eveningTopics = useMemo(
    () => (evening ? getTopicsFromSession(evening) : []),
    [evening]
  );

  return {
    user,
    nickname,
    todayId,

    selectedDate,
    setSelectedDate,

    energyMode,
    setEnergyMode,

    week,

    isLoading,
    status,

    morning,
    evening,

    insight,

    goEntry,
    goDetail,
    goProfile,

    goCalendar,
    openTopicInCalendar,

    morningTopics,
    eveningTopics,
  };
}
