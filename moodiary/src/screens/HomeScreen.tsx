import React, { useMemo } from "react";
import { View } from "react-native";
import { Card, Text, Button, Chip, Divider } from "react-native-paper";
import dayjs from "dayjs";

type MoodKey =
  | "very_bad"
  | "sad"
  | "anxious"
  | "angry"
  | "calm"
  | "content"
  | "good"
  | "very_good";

const MOODS: Array<{ key: MoodKey; label: string }> = [
  { key: "very_bad", label: "완전↓" },
  { key: "sad", label: "다운" },
  { key: "anxious", label: "불안" },
  { key: "angry", label: "짜증" },
  { key: "calm", label: "평온" },
  { key: "content", label: "만족" },
  { key: "good", label: "좋음" },
  { key: "very_good", label: "최고↑" },
];

export default function HomeScreen() {
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineMedium">Moodiary</Text>
        <Text style={{ opacity: 0.7 }}>{today}</Text>
      </View>

      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">오늘 상태</Text>
          <Text style={{ opacity: 0.7 }}>
            아직 Firestore 연결 전이라, 일단 UI 뼈대만 띄운 상태.
          </Text>

          <Divider />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button mode="contained" onPress={() => {}} style={{ flex: 1 }}>
              아침 기록하기
            </Button>
            <Button mode="outlined" onPress={() => {}} style={{ flex: 1 }}>
              저녁 기록하기
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">기분 선택(8개) UI 테스트</Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {MOODS.map((m) => (
              <Chip key={m.key} onPress={() => {}}>
                {m.label}
              </Chip>
            ))}
          </View>

          <Text style={{ opacity: 0.6 }}>
            (다음 단계에서 이걸 EntryScreen으로 빼고, Home은 “오늘 슬롯 상태
            분기”만 보여주게 만들자.)
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}
