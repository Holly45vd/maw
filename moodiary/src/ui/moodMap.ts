// src/ui/moodMap.tsx
import type React from "react";
import type { MoodKey } from "../core/types";

// ✅ SVG (assets/mood/*)
// - angry.svg는 현재 assets에 없어서(=옵션) 아이콘 없이 처리
import VeryBadIcon from "../../assets/mood/very_bad.svg";
import SadIcon from "../../assets/mood/sad.svg";
import AnxiousIcon from "../../assets/mood/anxious.svg";
import CalmIcon from "../../assets/mood/calm.svg";
import ContentIcon from "../../assets/mood/content.svg";
import GoodIcon from "../../assets/mood/good.svg";
import VeryGoodIcon from "../../assets/mood/verygood.svg";
import NeutralIcon from "../../assets/mood/neutral.svg"
export type MoodOption = {
  key: MoodKey;
  label: string;
  Icon?: React.ComponentType<any>;
};

export const MOOD_OPTIONS: MoodOption[] = [
  { key: "very_bad", label: "완전↓", Icon: VeryBadIcon },
  { key: "sad", label: "다운", Icon: SadIcon },
  { key: "anxious", label: "불안", Icon: AnxiousIcon },
  { key: "angry", label: "짜증", Icon: NeutralIcon }, // ✅ 여기
  { key: "calm", label: "평온", Icon: CalmIcon },
  { key: "content", label: "만족", Icon: ContentIcon },
  { key: "good", label: "좋음", Icon: GoodIcon },
  { key: "very_good", label: "최고↑", Icon: VeryGoodIcon },
];

// 혹시 label이 필요할 때
export function moodLabel(mood: MoodKey) {
  return MOOD_OPTIONS.find((m) => m.key === mood)?.label ?? String(mood);
}
