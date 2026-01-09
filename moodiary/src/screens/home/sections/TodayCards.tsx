import React from "react";
import { View } from "react-native";
import { Card, Text, Divider, Button, Chip } from "react-native-paper";

type SessionLite = {
  mood: string;
  energy: number;
  note?: string;
};

type Props = {
  selectedDate: string;
  todayId: string;
  isLoading: boolean;
  status: "empty" | "half" | "full";
  morning: SessionLite | null;
  evening: SessionLite | null;
  morningTopics: string[];
  eveningTopics: string[];
  goEntry: (slot: "morning" | "evening") => void;
  goDetail: (slot: "morning" | "evening") => void;
  onPressTopic?: (topic: string) => void; // optional (토픽 칩 클릭 이동)
};

export default function TodayCards({
  selectedDate,
  todayId,
  isLoading,
  status,
  morning,
  evening,
  morningTopics,
  eveningTopics,
  goEntry,
  goDetail,
  onPressTopic,
}: Props) {
  const MAX_TOPIC_CHIPS = 4;

  const TopicsRow = ({ topics }: { topics: string[] }) => {
    if (!topics || topics.length === 0) {
      return <Text style={{ opacity: 0.7 }}>토픽: —</Text>;
    }
    const shown = topics.slice(0, MAX_TOPIC_CHIPS);
    const rest = topics.length - shown.length;

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {shown.map((t) => (
          <Chip
            key={t}
            compact
            icon="tag-outline"
            onPress={() => onPressTopic?.(t)}
          >
            {t}
          </Chip>
        ))}
        {rest > 0 ? <Text style={{ opacity: 0.6 }}>+{rest}</Text> : null}
      </View>
    );
  };

  const statusLabel =
    isLoading
      ? "불러오는 중..."
      : status === "empty"
      ? "미기록"
      : status === "half"
      ? "부분 기록"
      : "완료";

  const dayTitle = selectedDate === todayId ? "Today" : "Selected Day";

  return (
    <Card style={{ borderRadius: 18 }}>
      <Card.Content style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text variant="titleMedium" style={{ fontWeight: "900" }}>
            {dayTitle}
          </Text>
          <Text style={{ opacity: 0.6 }}>{statusLabel}</Text>
        </View>

        <Divider />

        <View style={{ gap: 10 }}>
          {/* Morning */}
          <Card style={{ borderRadius: 16 }}>
            <Card.Content style={{ gap: 8 }}>
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

                  <TopicsRow topics={morningTopics} />

                  {morning.note ? (
                    <Text style={{ opacity: 0.7 }}>
                      메모: {morning.note.slice(0, 40)}
                      {morning.note.length > 40 ? "…" : ""}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={{ opacity: 0.7 }}>아직 아침 기록이 없다.</Text>
              )}
            </Card.Content>
          </Card>

          {/* Evening */}
          <Card style={{ borderRadius: 16 }}>
            <Card.Content style={{ gap: 8 }}>
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

                  <TopicsRow topics={eveningTopics} />

                  {evening.note ? (
                    <Text style={{ opacity: 0.7 }}>
                      메모: {evening.note.slice(0, 40)}
                      {evening.note.length > 40 ? "…" : ""}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={{ opacity: 0.7 }}>아직 저녁 기록이 없다.</Text>
              )}
            </Card.Content>
          </Card>
        </View>
      </Card.Content>
    </Card>
  );
}
