// src/screens/entry/components/EnergySection.tsx
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import type { EnergyLevel } from "../../../core/types";

const LABELS: Record<EnergyLevel, string> = {
  1: "Drained",
  2: "Low",
  3: "Moderate",
  4: "Good",
  5: "Fully Charged",
};

// Battery colors: yellow → green (charging feeling)
const ENERGY_COLORS: Record<EnergyLevel, string> = {
  1: "#FBC02D", // Yellow
  2: "#C0CA33", // Yellow-green
  3: "#7CB342", // Light green
  4: "#43A047", // Green
  5: "#2E7D32", // Deep green
};

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
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.6)";
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";

  const label = useMemo(() => LABELS[energy], [energy]);
  const activeColor = ENERGY_COLORS[energy];

  return (
    <Card style={{ borderRadius: 16, backgroundColor: surface }}>
      <Card.Content style={{ gap: 12 }}>
        <Text variant="titleMedium" style={{ color: onSurface }}>
          Energy
        </Text>

        {/* Current value */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ fontSize: 34, fontWeight: "900", color: onSurface }}>
              {energy}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: muted }}>
              /5
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 2 }}>
            <Text style={{ color: muted, fontWeight: "800" }}>{label}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: activeColor,
                  borderWidth: 1,
                  borderColor: outline,
                }}
              />
              <Text style={{ color: muted, fontWeight: "700", fontSize: 12 }}>
                Current level
              </Text>
            </View>
          </View>
        </View>

        {/* Battery UI */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Battery body */}
            <View
              style={{
                width: 220,
                height: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: outline,
                backgroundColor: surface,
                padding: 6,
              }}
            >
              <View style={{ flexDirection: "row", gap: 6, height: "100%" }}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const level = n as EnergyLevel;
                  const active = n <= energy;
                  const isSelected = n === energy;

                  return (
                    <Pressable
                      key={n}
                      onPress={() => onChange(level)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Select energy level ${n}`}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: outline,
                        backgroundColor: active
                          ? ENERGY_COLORS[level]
                          : "transparent",
                        opacity: active ? 1 : 0.22,
                        ...(isSelected
                          ? {
                              shadowColor: ENERGY_COLORS[level],
                              shadowOpacity: 0.35,
                              shadowRadius: 6,
                              elevation: 2,
                            }
                          : null),
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Battery cap */}
            <View
              style={{
                width: 10,
                height: 22,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: outline,
                backgroundColor: surface,
              }}
            />
          </View>

          {/* Scale */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: 220,
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <Text key={n} style={{ color: muted, fontWeight: "700" }}>
                {n}
              </Text>
            ))}
          </View>
        </View>

      </Card.Content>
    </Card>
  );
}
