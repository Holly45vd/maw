// /workspaces/maw/moodiary/src/screens/calendar/CalendarScreen.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Card, Text, Chip, ActivityIndicator } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";

import { useAuth } from "../../providers/AuthProvider";
import { useMonthSessions } from "../../query/useMonthSessions";
import { EntrySession, EntrySlot, ISODate, makeEntryId } from "../../core/types";

import WeekStrip from "./components/WeekStrip";
import MonthPickerModal from "./components/MonthPickerModal";
import SlotCard from "./components/SlotCard";

dayjs.extend(isSameOrBefore);

function ensureISODate(v: string): ISODate {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v as ISODate;
  return dayjs().format("YYYY-MM-DD") as ISODate;
}

function getTopicsFromSession(s: any): string[] {
  if (Array.isArray(s?.topics) && s.topics.length > 0) {
    return s.topics.map(String).map((t: string) => t.trim()).filter(Boolean);
  }
  const legacy = typeof s?.topic === "string" ? s.topic.trim() : "";
  return legacy ? [legacy] : [];
}

/** 선택 날짜 기준 주간(7일) */
function buildWeekStrip(selectedDate: ISODate) {
  const base = dayjs(selectedDate);
  const start = base.startOf("week"); // 일요일 시작
  return new Array(7)
    .fill(0)
    .map((_, i) => start.add(i, "day").format("YYYY-MM-DD") as ISODate);
}

export default function CalendarScreen() {
  const { user } = useAuth();

  const params = useLocalSearchParams();
  const focusTopic = typeof params.focusTopic === "string" ? params.focusTopic : "";

  const initialDate = ensureISODate(
    (typeof params.date === "string" && params.date) || dayjs().format("YYYY-MM-DD")
  );

  const initialMonth =
    (typeof params.month === "string" && params.month) ||
    dayjs(initialDate).format("YYYY-MM");

  const [selectedDate, setSelectedDate] = useState<ISODate>(initialDate);
  const [month, setMonth] = useState<string>(initialMonth);
  const [monthOpen, setMonthOpen] = useState(false);

  const { data, isLoading } = useMonthSessions(user?.uid ?? null, month);

  const dayMap = useMemo(() => {
    const map: Record<string, { morning?: EntrySession; evening?: EntrySession }> = {};
    (data ?? []).forEach((s) => {
      if (!map[s.date]) map[s.date] = {};
      map[s.date][s.slot] = s;
    });
    return map;
  }, [data]);

  const weekDates = useMemo(() => buildWeekStrip(selectedDate), [selectedDate]);

  const selectedStat = useMemo(() => dayMap[selectedDate] ?? {}, [dayMap, selectedDate]);
  const isFuture = useMemo(() => dayjs(selectedDate).isAfter(dayjs(), "day"), [selectedDate]);

  const headerLabel = useMemo(() => {
    const d = dayjs(selectedDate);
    const dow = ["일", "월", "화", "수", "목", "금", "토"][d.day()];
    return `${d.format("YYYY.MM.DD")} (${dow})`;
  }, [selectedDate]);

  const onSelectDate = (date: string) => {
    const iso = ensureISODate(date);
    setSelectedDate(iso);
    const m = dayjs(iso).format("YYYY-MM");
    if (m !== month) setMonth(m);
  };

  const onPrevWeek = () =>
    onSelectDate(dayjs(selectedDate).subtract(7, "day").format("YYYY-MM-DD"));
  const onNextWeek = () =>
    onSelectDate(dayjs(selectedDate).add(7, "day").format("YYYY-MM-DD"));

  // ✅ 라우트 파일명 기준 이동 + EntryId 표준(makeEntryId)
  const onPressSlot = (date: string, slot: EntrySlot, has: boolean) => {
    if (!user?.uid) return;

    const iso = ensureISODate(date);

    if (has) {
      router.push({
        pathname: "/entry-detail",
        params: { entryId: makeEntryId(iso, slot) },
      });
    } else {
      router.push({
        pathname: "/entry",
        params: { date: iso, slot },
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* 상단 헤더 */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ gap: 2 }}>
          <Text style={{ opacity: 0.65 }}>Calendar</Text>
          <Text variant="headlineSmall">{headerLabel}</Text>
        </View>
      </View>

      {/* focusTopic */}
      {focusTopic ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Chip onClose={() => router.setParams({ focusTopic: "" })} icon="filter">
            focus: {focusTopic}
          </Chip>
          <Text style={{ opacity: 0.65 }}>토픽 기준으로 날짜를 빠르게 찾는 용도</Text>
        </View>
      ) : null}

      {/* 주간 스트립 */}
      <WeekStrip
        monthLabel={dayjs(selectedDate).format("YYYY.MM")}
        weekDates={weekDates}
        selectedDate={selectedDate}
        dayMap={dayMap}
        focusTopic={focusTopic}
        getTopics={getTopicsFromSession}
        onSelectDate={onSelectDate}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onOpenMonth={() => setMonthOpen(true)}
      />

      {/* 아래: 오전/오후 */}
      {isLoading ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.7 }}>불러오는 중...</Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          <SlotCard
            title="오전 (Morning)"
            date={selectedDate}
            slot="morning"
            session={selectedStat.morning}
            isFuture={isFuture}
            focusTopic={focusTopic}
            getTopics={getTopicsFromSession}
            onPressSlot={onPressSlot}
          />
          <SlotCard
            title="오후 (Evening)"
            date={selectedDate}
            slot="evening"
            session={selectedStat.evening}
            isFuture={isFuture}
            focusTopic={focusTopic}
            getTopics={getTopicsFromSession}
            onPressSlot={onPressSlot}
          />
        </>
      )}

      {/* 월간 보기 모달 */}
      <MonthPickerModal
        visible={monthOpen}
        month={month}
        setMonth={setMonth}
        isLoading={isLoading}
        dayMap={dayMap}
        focusTopic={focusTopic}
        getTopics={getTopicsFromSession}
        onDismiss={() => setMonthOpen(false)}
        onSelectDate={(date) => {
          onSelectDate(date);
          setMonthOpen(false);
        }}
      />
    </ScrollView>
  );
}
