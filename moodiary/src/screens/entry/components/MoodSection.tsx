// src/screens/entry/components/MoodSection.tsx
import React, { useMemo } from "react";
import { View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import Slider from "@react-native-community/slider";

import type { MoodKey } from "../../../core/types";
import { MOOD_OPTIONS } from "../../../ui/moodMap";

export default function MoodSection({
  mood,
  onChange,
}: {
  mood: MoodKey;
  onChange: (m: MoodKey) => void;
}) {
  const { colors } = useTheme();
  const surface = colors.surface;
  const onSurface = colors.onSurface;
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.6)";
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";

  // ✅ 왼쪽=좋음 → 오른쪽=안좋음: 화면에서만 역순 사용
  const OPTIONS = useMemo(() => [...MOOD_OPTIONS].reverse(), []);

  const indexByKey = useMemo(() => {
    const m = new Map<MoodKey, number>();
    OPTIONS.forEach((x, i) => m.set(x.key, i));
    return m;
  }, [OPTIONS]);

  const keyByIndex = useMemo(() => OPTIONS.map((x) => x.key), [OPTIONS]);

  const currentIndex = indexByKey.get(mood) ?? 0;
  const current = OPTIONS[currentIndex];
  const Icon = current?.Icon;

  return (
    <Card style={{ borderRadius: 16, backgroundColor: surface }}>
      <Card.Content style={{ gap: 14 }}>

        {/* 큰 아이콘 */}
        <View style={{ alignItems: "center", gap: 10, paddingTop: 6 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: outline,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: surface,
            }}
          >
            {Icon ? <Icon width={84} height={84} /> : null}
          </View>

          <Text style={{ color: onSurface, fontSize: 18, fontWeight: "800" }}>
            {current?.label}
          </Text>
        </View>

        {/* 슬라이더 + 중간 라벨 */}
        <View style={{ gap: 10 }}>
          <Slider
            value={currentIndex}
            minimumValue={0}
            maximumValue={OPTIONS.length - 1}
            step={1} // ✅ 8칸 스냅
            onValueChange={(v) => {
              const idx = Math.max(0, Math.min(OPTIONS.length - 1, Math.round(v)));
              onChange(keyByIndex[idx]);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={outline}
            thumbTintColor={colors.primary}
          />

          {/* ✅ 중간중간 기분 이름(8개 전부) */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 2,
            }}
          >
            {OPTIONS.map((m, i) => {
              const active = i === currentIndex;
              return (
                <View key={m.key} style={{ alignItems: "center", flex: 1 }}>
                  {/* 작은 tick 느낌 */}
                  <View
                    style={{
                      width: 2,
                      height: active ? 10 : 6,
                      borderRadius: 2,
                      backgroundColor: active ? colors.primary : outline,
                      marginBottom: 6,
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      color: active ? onSurface : muted,
                      fontWeight: active ? "800" : "600",
                      maxWidth: 44,
                      textAlign: "center",
                    }}
                  >
                    {m.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 좌/우 설명(좋음 → 안좋음) */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: muted, fontWeight: "700" }}>좋음</Text>
            <Text style={{ color: muted, fontWeight: "700" }}>안좋음</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}
