// src/screens/calendar/components/WeekStrip.tsx
import React from "react";
import { View, Pressable } from "react-native";
import dayjs from "dayjs";
import { Card, Text, IconButton, Button } from "react-native-paper";
import type { EntrySession } from "../../../core/types";

type DayMap = Record<string, { morning?: EntrySession; evening?: EntrySession }>;

export default function WeekStrip({
  monthLabel,
  weekDates,
  selectedDate,
  dayMap,
  focusTopic,
  getTopics,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onOpenMonth,
}: {
  monthLabel: string;
  weekDates: string[];
  selectedDate: string;
  dayMap: DayMap;
  focusTopic: string;
  getTopics: (s: any) => string[];
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onOpenMonth: () => void;
}) {
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

  const dotChar = (hasSession: boolean, hit: boolean, focusing: boolean) => {
    if (!hasSession) return "○";            // 기록 없음
    if (!focusing) return "●";              // focusTopic 없으면: 기록 있음
    return hit ? "●" : "◌";                 // focusTopic 있으면: hit 여부 구분
  };

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <IconButton icon="chevron-left" onPress={onPrevWeek} />
          <Text variant="titleMedium">{monthLabel}</Text>
          <IconButton icon="chevron-right" onPress={onNextWeek} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {weekDates.map((date) => {
            const d = dayjs(date);
            const stat = dayMap[date] ?? {};
            const selected = date === selectedDate;
            const future = dayjs(date).isAfter(dayjs(), "day");

            const focusing = !!focusTopic;

            const morningHas = !!stat.morning;
            const eveningHas = !!stat.evening;

            const morningTopics = stat.morning ? getTopics(stat.morning as any) : [];
            const eveningTopics = stat.evening ? getTopics(stat.evening as any) : [];

            const morningHit = focusing ? (morningHas && morningTopics.includes(focusTopic)) : morningHas;
            const eveningHit = focusing ? (eveningHas && eveningTopics.includes(focusTopic)) : eveningHas;

            // 날짜 단위 hit (타일 흐리기용)
            let dayHit = true;
            if (focusing) {
              dayHit = morningHit || eveningHit;
            }

            return (
              <Pressable
                key={date}
                onPress={() => onSelectDate(date)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  marginHorizontal: 4,
                  borderRadius: 14,
                  alignItems: "center",
                  opacity: future ? 0.35 : dayHit ? 1 : 0.45,
                  borderWidth: selected ? 1 : 0,
                  borderColor: selected ? "rgba(0,0,0,0.2)" : "transparent",
                }}
              >
                <Text style={{ opacity: 0.7 }}>{WEEKDAYS[d.day()]}</Text>
                <Text style={{ fontSize: 18, fontWeight: selected ? "700" : "600" }}>
                  {d.date()}
                </Text>

                {/* ✅ 좌: 아침 / 우: 저녁 (focusTopic이면 hit 여부로 ●/◌ 구분) */}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  <Text style={{ fontSize: 12 }}>
                    {dotChar(morningHas, morningHit, focusing)}
                  </Text>
                  <Text style={{ fontSize: 12 }}>
                    {dotChar(eveningHas, eveningHit, focusing)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ opacity: 0.65 }}>
            좌: 아침 / 우: 저녁
            {focusTopic ? "  ·  ●=토픽 포함 / ◌=기록은 있으나 미포함" : ""}
          </Text>
          <Button mode="text" onPress={onOpenMonth}>
            월간 보기
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}
