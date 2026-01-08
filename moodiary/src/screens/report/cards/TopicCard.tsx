import React from "react";
import { View } from "react-native";
import { Card, Text, Divider, Chip } from "react-native-paper";
import type { ReportStatsV11 } from "../../../core/reportStats";

type Props = { topic: ReportStatsV11["topic"] };

function pct(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

export default function TopicCard({ topic }: Props) {
  const top1 = topic.top?.[0];
  const top2 = topic.top?.[1];

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium">주제(Topic)</Text>
        <Text style={{ opacity: 0.7 }}>이번 기간에 무엇이 많이 등장했는지</Text>

        <Divider />

        {!top1 ? (
          <Text>기록된 주제가 없어</Text>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ opacity: 0.75 }}>Top</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Chip>{top1.key} · {top1.count} ({pct(top1.ratio)})</Chip>
                {top2 ? <Chip>{top2.key} · {top2.count} ({pct(top2.ratio)})</Chip> : null}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ opacity: 0.75 }}>분포</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(topic.distribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([k, c]) => (
                    <Chip key={k}>{k} · {c}</Chip>
                  ))}
              </View>
              <Text style={{ opacity: 0.6 }}>(상위 6개만 표시)</Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}
