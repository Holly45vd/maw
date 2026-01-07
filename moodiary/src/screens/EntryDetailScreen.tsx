import React, { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  Card,
  Text,
  IconButton,
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { router } from "expo-router";

import { useAuth } from "../providers/AuthProvider";
import { useMonthSessions } from "../query/useMonthSessions";
import { EntrySession, EntrySlot } from "../core/types";

dayjs.extend(isSameOrBefore);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarScreen() {
  const { user } = useAuth();
  const today = dayjs().format("YYYY-MM-DD");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  const { data, isLoading } = useMonthSessions(user?.uid ?? null, month);

  /**
   * ✅ entryId 기준으로 morning / evening 판단
   * entryId = YYYY-MM-DD_slot
   */
  const dayMap = useMemo(() => {
    const map: Record<
      string,
      { morning: boolean; evening: boolean }
    > = {};

    (data ?? []).forEach((s: EntrySession) => {
      const [date, slot] = s.date && s.slot
        ? [s.date, s.slot]
        : s["entryId"]?.split("_") ?? [];

      if (!date || !slot) return;

      if (!map[date]) {
        map[date] = { morning: false, evening: false };
      }

      if (slot === "morning") map[date].morning = true;
      if (slot === "evening") map[date].evening = true;
    });

    return map;
  }, [data]);

  /** 달력 그리드 */
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

  const onPrev = () =>
    setMonth(dayjs(month).subtract(1, "month").format("YYYY-MM"));
  const onNext = () =>
    setMonth(dayjs(month).add(1, "month").format("YYYY-MM"));

  const goEntry = (date: string, slot: EntrySlot) => {
    router.push({
      pathname: "/(tabs)/entry",
      params: { date, slot },
    });
  };

  const goDetail = (date: string, slot: EntrySlot) => {
    router.push({
      pathname: "/(tabs)/entry-detail",
      params: { entryId: `${date}_${slot}` },
    });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <IconButton icon="chevron-left" onPress={onPrev} />
        <Text variant="titleLarge" style={{ flex: 1, textAlign: "center" }}>
          {dayjs(month).format("YYYY년 M월")}
        </Text>
        <IconButton icon="chevron-right" onPress={onNext} />
      </View>

      <Card>
        <Card.Content>
          {/* Weekday */}
          <View style={{ flexDirection: "row" }}>
            {WEEKDAYS.map((w) => (
              <View key={w} style={{ width: "14.28%", alignItems: "center" }}>
                <Text style={{ fontSize: 12, opacity: 0.6 }}>{w}</Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {days.map((d, idx) => {
                if (!d.date)
                  return <View key={idx} style={{ width: "14.28%" }} />;

                const stat = dayMap[d.date] ?? {
                  morning: false,
                  evening: false,
                };

                const isFuture = dayjs(d.date).isAfter(today, "day");
                const isPastOrToday = dayjs(d.date).isSameOrBefore(today);
                const isToday = d.date === today;

                const showAddMorning =
                  isPastOrToday && !isFuture && !stat.morning;
                const showAddEvening =
                  isPastOrToday && !isFuture && !stat.evening;

                return (
                  <View
                    key={d.date}
                    style={{
                      width: "14.28%",
                      alignItems: "center",
                      paddingVertical: 8,
                      opacity: isFuture ? 0.35 : 1,
                      gap: 4,
                    }}
                  >
                    {/* Date */}
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: isToday ? "#1976D2" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: isToday ? "#fff" : "#333" }}>
                        {dayjs(d.date).date()}
                      </Text>
                    </View>

                    {/* Dots */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Pressable
                        disabled={isFuture}
                        onPress={() =>
                          stat.morning
                            ? goDetail(d.date!, "morning")
                            : goEntry(d.date!, "morning")
                        }
                      >
                        <Text>{stat.morning ? "●" : "○"}</Text>
                      </Pressable>

                      <Pressable
                        disabled={isFuture}
                        onPress={() =>
                          stat.evening
                            ? goDetail(d.date!, "evening")
                            : goEntry(d.date!, "evening")
                        }
                      >
                        <Text>{stat.evening ? "●" : "○"}</Text>
                      </Pressable>
                    </View>

                    {/* CTA */}
                    {(showAddMorning || showAddEvening) && (
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {showAddMorning && (
                          <Button
                            compact
                            mode="text"
                            onPress={() => goEntry(d.date!, "morning")}
                          >
                            +아침
                          </Button>
                        )}
                        {showAddEvening && (
                          <Button
                            compact
                            mode="text"
                            onPress={() => goEntry(d.date!, "evening")}
                          >
                            +저녁
                          </Button>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}
