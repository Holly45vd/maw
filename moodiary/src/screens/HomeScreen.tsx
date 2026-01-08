import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import dayjs from "dayjs";
import {
  Card,
  Text,
  IconButton,
  Searchbar,
  Button,
  Divider,
  Chip,
} from "react-native-paper";
import { router } from "expo-router";

import EnergyGauge from "../ui/EnergyGauge";
import { buildDailyInsight } from "../core/insight";

import { useAuth } from "../providers/AuthProvider";
import { useUserDoc } from "../query/useUserDoc";
import { useTodaySessions } from "../query/useTodaySessions";

type DayItem = {
  date: string; // YYYY-MM-DD
  dow: string; // 일~토
  dayNum: number;
  isToday: boolean;
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: userDoc } = useUserDoc(user?.uid ?? null);

  const nickname =
    (userDoc?.displayName ?? user?.displayName ?? "나").trim() || "나";

  const todayId = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  // ✅ 기본 선택: 오늘
  const [selectedDate, setSelectedDate] = useState<string>(todayId);

  // ✅ 게이지 모드(아침/저녁) - 컴포넌트 안에 있어야 함
  const [energyMode, setEnergyMode] = useState<"morning" | "evening">("evening");

  // ✅ 주간 스트립: today-6 ... today (오늘이 맨 뒤)
  const week = useMemo<DayItem[]>(() => {
    const end = dayjs(todayId);
    const start = end.subtract(6, "day");
    return Array.from({ length: 7 }).map((_, i) => {
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
  const morning = data?.morning ?? null;
  const evening = data?.evening ?? null;

  const status =
    morning && evening ? "full" : morning || evening ? "half" : "empty";

  // ✅ insight는 컴포넌트 안 + morning/evening 이후
  const insight = useMemo(
    () => buildDailyInsight({ morning, evening }),
    [morning, evening]
  );

  const goEntry = (slot: "morning" | "evening") => {
    router.push({
      pathname: "/(tabs)/entry",
      params: { date: selectedDate, slot },
    });
  };

  const goDetail = (slot: "morning" | "evening") => {
    router.push({
      pathname: "/(tabs)/entry-detail",
      params: { entryId: `${selectedDate}_${slot}` },
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(30,136,229,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#1E88E5" }}>
              {nickname.slice(0, 1).toUpperCase()}
            </Text>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={{ opacity: 0.7 }}>Good day 👋</Text>
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              {nickname}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          <IconButton
            icon="cog-outline"
            onPress={() => router.push("/(tabs)/profile")}
          />
          <IconButton icon="bell-outline" onPress={() => {}} />
        </View>
      </View>

      <Searchbar
        placeholder="Search..."
        value={""}
        onChangeText={() => {}}
        style={{ borderRadius: 16 }}
      />

      {/* Week Strip */}
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ opacity: 0.7 }}>
            {dayjs(selectedDate).format("YYYY년 M월 D일 (ddd)")}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10, paddingVertical: 4 }}>
              {week.map((d) => {
                const selected = d.date === selectedDate;
                return (
                  <Pressable
                    key={d.date}
                    onPress={() => setSelectedDate(d.date)}
                    style={{
                      width: 62,
                      paddingVertical: 10,
                      borderRadius: 18,
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: selected
                        ? "#1E88E5"
                        : "rgba(0,0,0,0.04)",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#fff" : "rgba(0,0,0,0.6)",
                      }}
                    >
                      {d.dow}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: selected ? "#fff" : "#111",
                      }}
                    >
                      {d.dayNum}
                    </Text>

                    {/* 선택한 날짜만 dot 채움 */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor:
                            selected && morning
                              ? "#fff"
                              : selected
                              ? "rgba(255,255,255,0.35)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor:
                            selected && evening
                              ? "#fff"
                              : selected
                              ? "rgba(255,255,255,0.35)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>

      {/* ✅ 변화 요약 (아침+저녁 있을 때만) + 토글 버튼 */}
      {morning && evening ? (
        <Card style={{ borderRadius: 18 }}>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium" style={{ fontWeight: "900" }}>
              변화 요약
            </Text>

            {/* EnergyGauge는 mode를 받는 버전이어야 함 */}
            <EnergyGauge
              morning={morning.energy}
              evening={evening.energy}
              mode={energyMode}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                mode={energyMode === "morning" ? "contained" : "outlined"}
                style={{ flex: 1, borderRadius: 14 }}
                onPress={() => setEnergyMode("morning")}
              >
                아침
              </Button>
              <Button
                mode={energyMode === "evening" ? "contained" : "outlined"}
                style={{ flex: 1, borderRadius: 14 }}
                onPress={() => setEnergyMode("evening")}
              >
                저녁
              </Button>
            </View>

            <Text style={{ opacity: 0.7 }}>
              기분 변화: {String(morning.mood)} → {String(evening.mood)}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {/* Selected Day: 아침/저녁 카드 2개 */}
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text variant="titleMedium" style={{ fontWeight: "900" }}>
              {selectedDate === todayId ? "Today" : "Selected Day"}
            </Text>
            <Text style={{ opacity: 0.6 }}>
              {isLoading
                ? "불러오는 중..."
                : status === "empty"
                ? "미기록"
                : status === "half"
                ? "부분 기록"
                : "완료"}
            </Text>
          </View>

          <Divider />

          <View style={{ gap: 10 }}>
            {/* Morning */}
            <Card style={{ borderRadius: 16 }}>
              <Card.Content style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>아침</Text>
                  {morning ? (
                    <Button mode="text" onPress={() => goDetail("morning")}>
                      보기
                    </Button>
                  ) : (
                    <Button mode="contained" onPress={() => goEntry("morning")}>
                      + 기록
                    </Button>
                  )}
                </View>

                {morning ? (
                  <>
                    <Text style={{ opacity: 0.85 }}>
                      기분: {String(morning.mood)} · 에너지: {morning.energy}/5
                    </Text>
                    <Text style={{ opacity: 0.7 }}>
                      주제: {morning.topic}
                      {morning.note ? ` · ${morning.note.slice(0, 28)}` : ""}
                    </Text>
                  </>
                ) : (
                  <Text style={{ opacity: 0.7 }}>아직 아침 기록이 없다.</Text>
                )}
              </Card.Content>
            </Card>

            {/* Evening */}
            <Card style={{ borderRadius: 16 }}>
              <Card.Content style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>저녁</Text>
                  {evening ? (
                    <Button mode="text" onPress={() => goDetail("evening")}>
                      보기
                    </Button>
                  ) : (
                    <Button mode="contained" onPress={() => goEntry("evening")}>
                      + 기록
                    </Button>
                  )}
                </View>

                {evening ? (
                  <>
                    <Text style={{ opacity: 0.85 }}>
                      기분: {String(evening.mood)} · 에너지: {evening.energy}/5
                    </Text>
                    <Text style={{ opacity: 0.7 }}>
                      주제: {evening.topic}
                      {evening.note ? ` · ${evening.note.slice(0, 28)}` : ""}
                    </Text>
                  </>
                ) : (
                  <Text style={{ opacity: 0.7 }}>아직 저녁 기록이 없다.</Text>
                )}
              </Card.Content>
            </Card>
          </View>
        </Card.Content>
      </Card>

      {/* 오늘 한 줄 요약 + 배지 */}
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium" style={{ fontWeight: "900" }}>
            오늘 한 줄 요약
          </Text>

          <Text style={{ opacity: 0.82, lineHeight: 20 }}>{insight.line}</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {insight.badges.map((b) => (
              <Chip
                key={b.key}
                style={{
                  backgroundColor:
                    b.tone === "good"
                      ? "rgba(46,125,50,0.12)"
                      : b.tone === "bad"
                      ? "rgba(211,47,47,0.12)"
                      : "rgba(0,0,0,0.06)",
                }}
                textStyle={{
                  color:
                    b.tone === "good"
                      ? "#2E7D32"
                      : b.tone === "bad"
                      ? "#D32F2F"
                      : "rgba(0,0,0,0.7)",
                  fontWeight: "800",
                }}
              >
                {b.label}
              </Chip>
            ))}
          </View>

          {/* 기록이 덜 찼을 때만 CTA */}
          {!morning || !evening ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              {!morning ? (
                <Button
                  mode="contained"
                  style={{ flex: 1, borderRadius: 14 }}
                  onPress={() => goEntry("morning")}
                >
                  + 아침 기록
                </Button>
              ) : null}
              {!evening ? (
                <Button
                  mode="contained"
                  style={{ flex: 1, borderRadius: 14 }}
                  onPress={() => goEntry("evening")}
                >
                  + 저녁 기록
                </Button>
              ) : null}
            </View>
          ) : null}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
  