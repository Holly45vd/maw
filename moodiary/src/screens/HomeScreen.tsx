import React, { useMemo } from "react";
import { View } from "react-native";
import { Button, Card, Text, Divider } from "react-native-paper";
import dayjs from "dayjs";
import { router } from "expo-router";

import { useAuth } from "../providers/AuthProvider";
import { useTodaySessions } from "../query/useTodaySessions";

export default function HomeScreen() {
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const { user } = useAuth();

  const { data, isLoading } = useTodaySessions(user?.uid ?? null);

  const morning = data?.morning ?? null;
  const evening = data?.evening ?? null;

  const status =
    !!morning && !!evening ? "full" : !!morning || !!evening ? "half" : "empty";

const goEntry = (slot: "morning" | "evening") => {
  router.push({ pathname: "/entry", params: { date: today, slot } });
};

const goDetail = (slot: "morning" | "evening") => {
  const entryId = `${today}_${slot}`;
  router.push({ pathname: "/entry-detail", params: { entryId } });
};

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineMedium">Moodiary</Text>
        <Text style={{ opacity: 0.7 }}>{today}</Text>
      </View>

      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">오늘 기록</Text>

          {isLoading ? (
            <Text style={{ opacity: 0.7 }}>불러오는 중...</Text>
          ) : (
            <Text style={{ opacity: 0.7 }}>
              상태:{" "}
              {status === "empty"
                ? "미기록"
                : status === "half"
                ? "부분 기록"
                : "완료"}
            </Text>
          )}

          <Divider />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              mode={morning ? "outlined" : "contained"}
              style={{ flex: 1 }}
             onPress={() => (morning ? goDetail("morning") : goEntry("morning"))}

            >
              {morning ? "아침 기록 수정" : "아침 기록하기"}
            </Button>

            <Button
              mode={evening ? "outlined" : "contained"}
              style={{ flex: 1 }}
              onPress={() => (evening ? goDetail("evening") : goEntry("evening"))}

            >
              {evening ? "저녁 기록 수정" : "저녁 기록하기"}
            </Button>
          </View>

          {morning && evening ? (
            <Card style={{ marginTop: 8 }}>
              <Card.Content style={{ gap: 6 }}>
                <Text variant="titleSmall">오늘 변화</Text>
                <Text style={{ opacity: 0.8 }}>
                  에너지 변화: {evening.energy - morning.energy}
                </Text>
              </Card.Content>
            </Card>
          ) : null}
        </Card.Content>
      </Card>
    </View>
  );
}
