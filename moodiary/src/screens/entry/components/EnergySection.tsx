// src/screens/entry/components/EnergySection.tsx
import React from "react";
import { Card, SegmentedButtons, Text, useTheme } from "react-native-paper";
import type { EnergyLevel } from "../../../core/types";

const ENERGIES: { key: EnergyLevel; label: string }[] = [
  { key: 1, label: "1" },
  { key: 2, label: "2" },
  { key: 3, label: "3" },
  { key: 4, label: "4" },
  { key: 5, label: "5" },
];

export default function EnergySection({
  energy,
  onChange,
}: {
  energy: EnergyLevel;
  onChange: (v: EnergyLevel) => void;
}) {
  const { colors } = useTheme();
  const surface = colors.surface;
  const onSurface = colors.onSurface;

  return (
    <Card style={{ borderRadius: 16, backgroundColor: surface }}>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium" style={{ color: onSurface }}>
          에너지 (1~5)
        </Text>

        <SegmentedButtons
          value={String(energy)}
          onValueChange={(v) => onChange(Number(v) as EnergyLevel)}
          buttons={ENERGIES.map((e) => ({ value: String(e.key), label: e.label }))}
          style={{ backgroundColor: surface }}
        />
      </Card.Content>
    </Card>
  );
}
