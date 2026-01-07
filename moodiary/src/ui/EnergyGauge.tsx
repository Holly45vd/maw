import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";
import { Text } from "react-native-paper";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Props = {
  morning: number; // 1~5
  evening: number; // 1~5
  mode: "morning" | "evening"; // ✅ 어떤 값을 보여줄지
};

export default function EnergyGauge({ morning, evening, mode }: Props) {
  const m = clamp(morning, 1, 5);
  const e = clamp(evening, 1, 5);

  const value = mode === "morning" ? m : e;

  const anim = useRef(new Animated.Value(value / 5)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 5,
      duration: 360,
      useNativeDriver: false, // width 애니메이션
    }).start();
  }, [value, anim]);

  const label = useMemo(() => {
    const delta = e - m;
    if (!delta) return "유지";
    return delta > 0 ? `+${delta}` : `${delta}`;
  }, [m, e]);

  return (
    <View style={{ gap: 10 }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontWeight: "900" }}>Energy</Text>

          {/* 변화는 참고용으로만 */}
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Text style={{ fontWeight: "900", opacity: 0.75 }}>{label}</Text>
          </View>
        </View>

        <Text style={{ opacity: 0.7 }}>
          {m}/5 → {e}/5
        </Text>
      </View>

      {/* 게이지 */}
      <View
        style={{
          height: 14,
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: "rgba(30,136,229,0.28)",
          }}
        />
      </View>

      {/* 현재 모드 표시(작게) */}
      <Text style={{ opacity: 0.6 }}>
        현재: {mode === "morning" ? "아침" : "저녁"} ({value}/5)
      </Text>
    </View>
  );
}
