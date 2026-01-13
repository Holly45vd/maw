import React from "react";
import { View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { orbit } from "../../../ui/theme";

type Props = {
  nickname: string;
  onPressProfile: () => void;
  onPressBell?: () => void;
};

export default function HeaderSection({
  nickname,
  onPressProfile,
  onPressBell,
}: Props) {
  const name = (nickname ?? "나").trim() || "나";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <View style={{ gap: orbit.spacing.gapSm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Avatar + Greeting */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: orbit.colors.mutedPill,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: orbit.colors.line,
            }}
          >
            <Text style={{ fontWeight: "900", color: orbit.colors.primary }}>
              {initial}
            </Text>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={{ color: orbit.colors.subtext, fontWeight: "800" }}>
              GOOD MORNING
            </Text>
            <Text style={{ ...orbit.typography.hero, color: orbit.colors.text }}>
              {name}
            </Text>
          </View>
        </View>

        {/* Right: actions */}
        <View style={{ flexDirection: "row", gap: 2 }}>
          <IconButton
            icon="bell-outline"
            onPress={onPressBell ?? (() => {})}
          />
          <IconButton icon="cog-outline" onPress={onPressProfile} />
        </View>
      </View>

      {/* subtle divider */}
      <View
        style={{
          height: 1,
          backgroundColor: orbit.colors.line,
          opacity: 0.9,
        }}
      />
    </View>
  );
}
