import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import dayjs from "dayjs";
import { Card, Text } from "react-native-paper";

type DayItem = {
  date: string; // YYYY-MM-DD
  dow: string; // 일~토
  dayNum: number;
  isToday: boolean;
};

type Props = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  week: DayItem[];
  hasMorning: boolean;
  hasEvening: boolean;
};

export default function WeekSection({
  selectedDate,
  setSelectedDate,
  week,
  hasMorning,
  hasEvening,
}: Props) {
  return (
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
                    backgroundColor: selected ? "#1E88E5" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <Text style={{ color: selected ? "#fff" : "rgba(0,0,0,0.6)" }}>
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

                  {/* 선택한 날짜에 대해서만 dot에 의미 부여(현재 로직 유지) */}
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor:
                          selected && hasMorning
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
                          selected && hasEvening
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
  );
}
