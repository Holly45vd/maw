// src/screens/calendar/components/MonthPickerModal.tsx
import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import dayjs from "dayjs";
import {
  Portal,
  Modal,
  Text,
  IconButton,
  Divider,
  Button,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import type { EntrySession } from "../../../core/types";

type DayMap = Record<string, { morning?: EntrySession; evening?: EntrySession }>;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MonthPickerModal({
  visible,
  onDismiss,
  month,
  setMonth,
  dayMap,
  isLoading,
  onSelectDate,
  focusTopic,
  getTopics,
}: {
  visible: boolean;
  onDismiss: () => void;
  month: string;
  setMonth: (m: string) => void;
  dayMap: DayMap;
  isLoading: boolean;
  onSelectDate: (date: string) => void;
  focusTopic: string;
  getTopics: (s: any) => string[];
}) {
  const days = useMemo(() => {
    const start = dayjs(`${month}-01`);
    const end = start.endOf("month");
    const firstDow = start.day();

    const arr: Array<{ date?: string }> = [];
    for (let i = 0; i < firstDow; i++) arr.push({});
    for (let d = 1; d <= end.date(); d++) {
      arr.push({ date: start.date(d).format("YYYY-MM-DD") });
    }
    return arr;
  }, [month]);

  const onPrevMonth = () => setMonth(dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM"));
  const onNextMonth = () => setMonth(dayjs(`${month}-01`).add(1, "month").format("YYYY-MM"));

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          margin: 16,
          padding: 16,
          borderRadius: 16,
          backgroundColor: "white",
        }}
      >
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="titleLarge">월간 보기</Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          <Divider />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <IconButton icon="chevron-left" onPress={onPrevMonth} />
            <Text variant="titleMedium">{month}</Text>
            <IconButton icon="chevron-right" onPress={onNextMonth} />
          </View>

          {focusTopic ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <Chip icon="filter">{focusTopic}</Chip>
              <Text style={{ opacity: 0.65 }}>해당 토픽이 있는 날을 찾는 용도</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={{ width: `${100 / 7}%`, textAlign: "center", opacity: 0.7 }}>
                {w}
              </Text>
            ))}
          </View>

          {isLoading ? (
            <View style={{ gap: 10, alignItems: "center", paddingVertical: 12 }}>
              <ActivityIndicator />
              <Text style={{ opacity: 0.7 }}>불러오는 중...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {days.map((d, idx) => {
                const stat = d.date ? dayMap[d.date] ?? {} : {};
                const isFuture = d.date ? dayjs(d.date).isAfter(dayjs(), "day") : false;

                // focusTopic이면 해당 날짜가 히트인지 체크(없으면 흐리게)
                let hit = true;
                if (d.date && focusTopic) {
                  const ms = stat.morning ? getTopics(stat.morning as any) : [];
                  const es = stat.evening ? getTopics(stat.evening as any) : [];
                  hit = ms.includes(focusTopic) || es.includes(focusTopic);
                }

                return (
                  <Pressable
                    key={`${d.date ?? "blank"}-${idx}`}
                    disabled={!d.date}
                    onPress={() => d.date && onSelectDate(d.date)}
                    style={{
                      width: `${100 / 7}%`,
                      padding: 6,
                      minHeight: 62,
                      opacity: d.date ? (isFuture ? 0.35 : hit ? 1 : 0.45) : 0,
                    }}
                  >
                    {!d.date ? null : (
                      <View style={{ gap: 6, alignItems: "center" }}>
                        <Text style={{ textAlign: "center" }}>{dayjs(d.date).date()}</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <Text style={{ fontSize: 12 }}>{stat.morning ? "●" : "○"}</Text>
                          <Text style={{ fontSize: 12 }}>{stat.evening ? "●" : "○"}</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          <Button mode="contained" onPress={onDismiss}>
            닫기
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
