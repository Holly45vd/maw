import React, { useMemo } from "react";
import { View } from "react-native";
import { Card, Text, Divider, Chip } from "react-native-paper";
import type { ReportStatsV11 } from "../../../core/reportStats";

type Props = {
  volume: ReportStatsV11["volume"];
  energy: ReportStatsV11["energy"];
};

function fmtDelta(v: number | null) {
  if (v === null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}`;
}

function typeHint(deltaType: ReportStatsV11["energy"]["deltaType"]) {
  switch (deltaType) {
    case "회복형":
      return "저녁에 에너지가 오르는 경향";
    case "소모형":
      return "저녁에 에너지가 떨어지는 경향";
    case "안정형":
      return "큰 변화 없이 비슷함";
    case "변동형":
      return "오르내림이 섞여 있음";
    default:
      return "";
  }
}

export default function KpiCard({ volume, energy }: Props) {
  const label = energy.deltaType ?? "—";
  const hint = typeHint(energy.deltaType);

  const deltaChip = useMemo(() => {
    if (energy.avgDailyDelta === null) return { text: "Δ —" };
    const sign = energy.avgDailyDelta > 0 ? "+" : "";
    return { text: `Δ ${sign}${energy.avgDailyDelta.toFixed(1)}` };
  }, [energy.avgDailyDelta]);

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <View style={{ gap: 2 }}>
          <Text variant="titleMedium">이번 기간 결론</Text>
          <Text style={{ opacity: 0.7 }}>
            완성된 날 {volume.completeDays}일 기준 (아침+저녁 모두 있는 날만 Δ 계산)
          </Text>
        </View>

        <Divider />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ gap: 6, flex: 1 }}>
            <Text style={{ opacity: 0.7 }}>Energy Delta</Text>
            <Text variant="displaySmall">{fmtDelta(energy.avgDailyDelta)}</Text>
            <Text style={{ opacity: 0.75 }}>{hint}</Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <Chip>{label}</Chip>
            <Chip>{deltaChip.text}</Chip>
          </View>
        </View>

        <Divider />

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip>상승 {energy.deltaDays.up}일</Chip>
          <Chip>유지 {energy.deltaDays.flat}일</Chip>
          <Chip>하락 {energy.deltaDays.down}일</Chip>
        </View>
      </Card.Content>
    </Card>
  );
}
