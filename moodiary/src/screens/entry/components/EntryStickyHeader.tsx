// src/screens/entry/components/EntryStickyHeader.tsx
import React from "react";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

type Props = {
  dateText: string; // "2026-01-13 (화)"
  slotLabel: string; // "오전" | "오후"
  SlotIcon: React.ComponentType<any>;
  saving: boolean;
  onSave: () => void;
};

export default function EntryStickyHeader({
  dateText,
  slotLabel,
  SlotIcon,
  saving,
  onSave,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;

  const bg = colors.background;
  const surface = colors.surface;
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";
  const onSurface = colors.onSurface;
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.6)";
  const primary = colors.primary;

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: outline,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* ✅ 아이콘 크게 + 원형 느낌 제거 */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: surface,
              borderWidth: 1,
              borderColor: outline,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlotIcon width={38} height={38} />
          </View>

          <View style={{ gap: 3 }}>
            <Text style={{ color: onSurface, fontWeight: "800", fontSize: 16 }}>{dateText}</Text>
            <Text style={{ color: muted, fontSize: 13 }}>{slotLabel} 기록</Text>
          </View>
        </View>

        {/* ✅ 원형 버튼 느낌 제거(각 잡힌 outlined) */}
        <Button
          mode="outlined"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          textColor={primary}
          style={{
            borderColor: outline,
            borderWidth: 1,
            borderRadius: 10,
          }}
          contentStyle={{
            paddingVertical: 6,
            paddingHorizontal: 10,
          }}
          labelStyle={{ fontWeight: "800" }}
        >
          저장
        </Button>
      </View>
    </View>
  );
}
