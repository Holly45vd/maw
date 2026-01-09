import React from "react";
import { View } from "react-native";
import { Card, Text, Chip, Button } from "react-native-paper";

type InsightBadge = {
  key: string;
  label: string;
  tone: "good" | "bad" | "neutral";
};

type Insight = {
  line: string;
  badges: InsightBadge[];
};

type Props = {
  insight: Insight;
  hasMorning: boolean;
  hasEvening: boolean;
  goEntry: (slot: "morning" | "evening") => void;
};

export default function InsightSection({
  insight,
  hasMorning,
  hasEvening,
  goEntry,
}: Props) {
  return (
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
        {!hasMorning || !hasEvening ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {!hasMorning ? (
              <Button
                mode="contained"
                style={{ flex: 1, borderRadius: 14 }}
                onPress={() => goEntry("morning")}
              >
                + 아침 기록
              </Button>
            ) : null}
            {!hasEvening ? (
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
  );
}
