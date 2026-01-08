// src/screens/report/ReportScreen.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import dayjs from "dayjs";
import {
  Card,
  Text,
  SegmentedButtons,
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { router } from "expo-router";

import { useAuth } from "../../providers/AuthProvider";
import { useReportSessions } from "../../query/useReportSessions";
import { ReportMode, buildReportStatsV11 } from "../../core/reportStats";
import { runCoach, CoachCTA } from "../../core/coachEngine";
import { makeEntryId } from "../../core/types";

// cards
import GateCard from "./cards/GateCard";
import KpiCard from "./cards/KpiCard";
import EnergyCard from "./cards/EnergyCard";
import MoodCard from "./cards/MoodCard";
import TopicCard from "./cards/TopicCard";
import CoachCard from "./cards/CoachCard";

function calcRange(mode: ReportMode) {
  const days = mode === "7d" ? 7 : 30;
  const end = dayjs().format("YYYY-MM-DD");
  const start = dayjs().subtract(days - 1, "day").format("YYYY-MM-DD");
  return { start, end, days };
}

function getTopicsFromSession(s: any): string[] {
  if (Array.isArray(s?.topics) && s.topics.length > 0) {
    return s.topics.map(String).map((t: string) => t.trim()).filter(Boolean);
  }
  const legacy = typeof s?.topic === "string" ? s.topic.trim() : "";
  return legacy ? [legacy] : [];
}

export default function ReportScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ReportMode>("7d");
  const range = useMemo(() => calcRange(mode), [mode]);

  const { data, isLoading, isError, refetch } = useReportSessions(
    user?.uid ?? null,
    range.start,
    range.end
  );

  const sessions = data ?? [];
  const stats = useMemo(
    () => buildReportStatsV11(mode, sessions, range),
    [mode, sessions, range]
  );

  const coach = useMemo(() => runCoach(stats), [stats]);

  // ---- navigation helpers ----
  const today = dayjs().format("YYYY-MM-DD");
  const thisMonth = dayjs().format("YYYY-MM");

  const goEntry = (
    slot: "morning" | "evening",
    date = today,
    extra?: Record<string, any>
  ) => {
    router.push({ pathname: "/(tabs)/entry", params: { date, slot, ...extra } });
  };

  const goCalendar = (extra?: Record<string, any>) => {
    router.push({ pathname: "/(tabs)/calendar", params: { ...extra } });
  };

  // ---- CoachCTA navigation ----
  const onPressCoachCta = (cta: CoachCTA) => {
    switch (cta.id) {
      case "WRITE_MORNING":
        return goEntry("morning", today, { ctaId: cta.id });

      case "WRITE_EVENING":
        return goEntry("evening", today, { ctaId: cta.id });

      case "REVIEW_TOPIC_TOP": {
        const topic = (cta.payload?.topic ?? "").trim();

        // topic이 없으면 캘린더로(기본)
        if (!topic) return goCalendar({ month: thisMonth });

        // ✅ 대표 날짜 찾기: 해당 topic 포함 날짜 중 "완성일(아침+저녁)" 최신 우선
        const byDate: Record<string, { morning?: any; evening?: any }> = {};

        for (const s of sessions) {
          const topics = getTopicsFromSession(s);
          if (!topics.includes(topic)) continue;

          const d = s.date;
          byDate[d] ??= {};
          byDate[d][s.slot] = s;
        }

        const dates = Object.keys(byDate);
        if (dates.length === 0) {
          // 혹시나 못 찾으면 캘린더(표시/필터)
          return goCalendar({ month: thisMonth, focusTopic: topic });
        }

        const sortedDesc = dates.sort((a, b) => (a > b ? -1 : 1));
        const completeDesc = sortedDesc.filter(
          (d) => byDate[d].morning && byDate[d].evening
        );

        const pickedDate = completeDesc[0] ?? sortedDesc[0];
        const slot = (byDate[pickedDate].evening ? "evening" : "morning") as
          | "morning"
          | "evening";

        return router.push({
          pathname: "/(tabs)/entry-detail",
          params: { entryId: makeEntryId(pickedDate, slot) },
        });
      }

      // 행동형 CTA → 저녁 기록으로 연결(힌트 배너 노출)
      case "BREATH_3M":
      case "WALK_10M":
      case "SLEEP_HYGIENE":
      case "PLAN_RECOVERY_1":
      case "REDUCE_LOAD_1":
        return goEntry("evening", today, {
          ctaId: cta.id,
          ctaTopic: cta.payload?.topic ?? "",
        });

      default:
        return goEntry("evening", today, { ctaId: cta.id });
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text variant="headlineMedium">Report</Text>
        <Text style={{ opacity: 0.7 }}>
          {range.start} ~ {range.end} ({range.days}일)
        </Text>
      </View>

      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as ReportMode)}
        buttons={[
          { value: "7d", label: "최근 7일" },
          { value: "30d", label: "최근 30일" },
        ]}
      />

      {!user?.uid ? (
        <Card>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">로그인이 필요해</Text>
            <Text style={{ opacity: 0.7 }}>
              리포트는 개인 기록을 기반으로 계산돼서 로그인 후 사용할 수 있다.
            </Text>
          </Card.Content>
        </Card>
      ) : isLoading ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.7 }}>리포트 데이터를 불러오는 중...</Text>
          </Card.Content>
        </Card>
      ) : isError ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">불러오기에 실패</Text>
            <Button mode="contained" onPress={() => refetch()}>
              다시 불러오기
            </Button>
          </Card.Content>
        </Card>
      ) : !stats.gate.ok ? (
        <GateCard mode={mode} gate={stats.gate} />
      ) : (
        <>
          <KpiCard volume={stats.volume} energy={stats.energy} />
          <EnergyCard energy={stats.energy} />
          <MoodCard mood={stats.mood} />
          <TopicCard topic={stats.topic} />
          <CoachCard coach={coach} onPressCta={onPressCoachCta} />
        </>
      )}
    </ScrollView>
  );
}
