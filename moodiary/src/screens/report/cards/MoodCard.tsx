import React from "react";
import { View } from "react-native";
import { Card, Text, Chip } from "react-native-paper";
import type { ReportStatsV11 } from "../../../core/reportStats";

export default function MoodCard({ mood }: { mood: ReportStatsV11["mood"] | undefined }) {
  // ✅ 방어: props가 꼬여도 앱이 안 죽게
  if (!mood) {
    return (
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">기분 분포</Text>
          <Text style={{ opacity: 0.7 }}>표시할 무드 데이터가 없어 (props 연결 확인 필요)</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium">기분 분포</Text>

        <Text style={{ opacity: 0.7 }}>
          평균 점수: {mood.avgScore === null ? "—" : `${mood.avgScore}/8`}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {mood.order.map((k) => (
            <Chip key={k}>
              {mood.labelsKo[k]} · {mood.distribution[k] ?? 0}
            </Chip>
          ))}
        </View>

        <Text style={{ opacity: 0.7 }}>Top</Text>
        {mood.top.length === 0 ? (
          <Text>—</Text>
        ) : (
          mood.top.map((m) => (
            <Text key={m.key}>
              • {mood.labelsKo[m.key as any] ?? m.key} ({m.count})
            </Text>
          ))
        )}
      </Card.Content>
    </Card>
  );
}
