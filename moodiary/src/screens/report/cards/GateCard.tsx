import React, { useMemo } from "react";
import { View } from "react-native";
import { Card, Text, Divider, ProgressBar } from "react-native-paper";
import { ReportGate, ReportMode } from "../../../core/reportStats";

export default function GateCard({ mode, gate }: { mode: ReportMode; gate: ReportGate }) {
  const progress = useMemo(
    () => Math.min(1, gate.daysRecorded / gate.requiredDays),
    [gate.daysRecorded, gate.requiredDays]
  );

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium">아직 리포트를 만들기엔 데이터가 부족해</Text>
        <Text style={{ opacity: 0.75 }}>
          {mode === "7d"
            ? "최근 7일 리포트는 최소 3일 이상 기록(세션 4개 이상)이 필요하다."
            : "최근 30일 리포트는 최소 7일 이상 기록(세션 10개 이상)이 필요하다."}
        </Text>

        <Divider />

        <View style={{ gap: 6 }}>
          <Text>
            진행: {gate.daysRecorded}/{gate.requiredDays}일 · 세션 {gate.totalSessions}/{gate.requiredSessions}
          </Text>
          <ProgressBar progress={progress} />
        </View>

        <Text style={{ opacity: 0.65 }}>
          팁: 아침/저녁 둘 다 채우는 날이 늘수록 “변화(Delta)” 분석이 정확해진다.
        </Text>
      </Card.Content>
    </Card>
  );
}
