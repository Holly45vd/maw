import React from "react";
import { View } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import EnergyGauge from "../../../ui/EnergyGauge";

type Props = {
  morning: { energy: number; mood: string } | null;
  evening: { energy: number; mood: string } | null;
  energyMode: "morning" | "evening";
  setEnergyMode: (mode: "morning" | "evening") => void;
};

export default function SummarySection({
  morning,
  evening,
  energyMode,
  setEnergyMode,
}: Props) {
  if (!morning || !evening) return null;

  return (
    <Card style={{ borderRadius: 18 }}>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium" style={{ fontWeight: "900" }}>
          변화 요약
        </Text>

        <EnergyGauge
          morning={Number(morning.energy)}
          evening={Number(evening.energy)}
          mode={energyMode}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            mode={energyMode === "morning" ? "contained" : "outlined"}
            style={{ flex: 1, borderRadius: 14 }}
            onPress={() => setEnergyMode("morning")}
          >
            아침
          </Button>
          <Button
            mode={energyMode === "evening" ? "contained" : "outlined"}
            style={{ flex: 1, borderRadius: 14 }}
            onPress={() => setEnergyMode("evening")}
          >
            저녁
          </Button>
        </View>

        <Text style={{ opacity: 0.7 }}>
          기분 변화: {String(morning.mood)} → {String(evening.mood)}
        </Text>
      </Card.Content>
    </Card>
  );
}
