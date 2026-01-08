import React from "react";
import { View } from "react-native";
import { Card, Text, Divider, ProgressBar } from "react-native-paper";
import type { ReportStatsV11 } from "../../../core/reportStats";

type Props = { energy: ReportStatsV11["energy"] };

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function toGauge(v: number | null) {
  if (v === null) return null;
  return clamp01((v - 1) / 4); // 1~5 → 0~1
}

function fmt(v: number | null) {
  return v === null ? "—" : v.toFixed(1);
}

export default function EnergyCard({ energy }: Props) {
  const m = toGauge(energy.morningAvg);
  const e = toGauge(energy.eveningAvg);

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium">에너지 요약</Text>
        <Text style={{ opacity: 0.7 }}>아침/저녁 평균 에너지(1~5)</Text>

        <Divider />

        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text>아침 평균</Text>
              <Text style={{ opacity: 0.8 }}>{fmt(energy.morningAvg)}</Text>
            </View>
            <ProgressBar progress={m ?? 0} />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text>저녁 평균</Text>
              <Text style={{ opacity: 0.8 }}>{fmt(energy.eveningAvg)}</Text>
            </View>
            <ProgressBar progress={e ?? 0} />
          </View>
        </View>

        <Divider />

        <Text style={{ opacity: 0.75 }}>
          Δ(저녁-아침) 평균: {energy.avgDailyDelta === null ? "—" : energy.avgDailyDelta.toFixed(1)}
        </Text>
      </Card.Content>
    </Card>
  );
}
