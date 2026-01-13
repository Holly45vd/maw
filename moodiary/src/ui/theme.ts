// src/ui/theme.ts
export const orbit = {
  colors: {
    primary: "#6C5CE7", // 보라
    accent: "#FDCB6E", // 노랑
    bg: "#FFFFFF", // 전체 배경
    card: "#FFFFFF",
    text: "#1C1C1E",
    subtext: "#6E6E73",
    line: "#ECECF1",
    danger: "#E74C3C",
    mutedPill: "#F1EFFA", // 연보라 pill 배경
  },

  radius: {
    card: 24,
    pill: 18,
    soft: 14,
  },

  spacing: {
    screen: 16,
    card: 16,
    gap: 12,
    gapSm: 8,
    gapXs: 6,
  },

  // Text는 Paper의 variant를 쓰되, 자주 쓰는 굵기/사이즈만 통일
  typography: {
    hero: { fontSize: 28, fontWeight: "900" as const, letterSpacing: -0.4 },
    title: { fontSize: 18, fontWeight: "800" as const },
    body: { fontSize: 14, fontWeight: "600" as const },
    sub: { fontSize: 12, fontWeight: "600" as const },
  },

  shadow: {
    // iOS/Android 공통으로 “은은하게”
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
} as const;
