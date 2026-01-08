// src/core/coachEngine.ts
import { ReportStatsV11 } from "./reportStats";

export type CoachCtaId =
  | "WRITE_MORNING"
  | "WRITE_EVENING"
  | "BREATH_3M"
  | "WALK_10M"
  | "SLEEP_HYGIENE"
  | "PLAN_RECOVERY_1"
  | "REDUCE_LOAD_1"
  | "REVIEW_TOPIC_TOP";

export type CoachCTA = {
  id: CoachCtaId;
  title: string;
  intent: "primary" | "secondary";
  payload?: any;
};

export type CoachResult = {
  title: string;
  message: string;
  evidence: string[];
  ctas: CoachCTA[]; // <= 2
};

type Rule = {
  id: string;
  priority: number;
  when: (s: ReportStatsV11) => boolean;
  build: (s: ReportStatsV11) => CoachResult;
};

const cta = (id: CoachCtaId, title: string, intent: "primary" | "secondary", payload?: any): CoachCTA => ({
  id,
  title,
  intent,
  payload,
});

export function runCoach(stats: ReportStatsV11): CoachResult | null {
  if (!stats.gate.ok) return null;

  const rules: Rule[] = [
    {
      id: "need_complete_days",
      priority: 100,
      when: (s) => s.volume.completeDays < Math.max(2, Math.floor(s.volume.daysRecorded * 0.5)),
      build: (s) => ({
        title: "아침+저녁 세트를 늘리면 분석이 확 좋아져",
        message:
          "Delta는 아침+저녁이 모두 있는 날만 계산돼. 이번 기간엔 ‘완성된 날’이 적어서 패턴 확정은 아직 이르다. 먼저 저녁 기록부터 고정해봐.",
        evidence: [`완성된 날: ${s.volume.completeDays}일`, `기록한 날: ${s.volume.daysRecorded}일`],
        ctas: [
          cta("WRITE_EVENING", "오늘 저녁 기록하기", "primary", { slot: "evening" }),
          cta("WRITE_MORNING", "내일 아침 기록하기", "secondary", { slot: "morning" }),
        ],
      }),
    },
    {
      id: "delta_down_strong",
      priority: 90,
      when: (s) => (s.energy.avgDailyDelta ?? 0) <= -0.6,
      build: (s) => ({
        title: "저녁으로 갈수록 에너지 소모가 누적돼",
        message:
          "최근 기간에서 아침 대비 저녁 에너지가 평균적으로 내려갔어. ‘수면/식사/과부하’ 중 하나만 고정해서 원인을 좁혀보자.",
        evidence: [`평균 Δ: ${s.energy.avgDailyDelta}`, `하락일: ${s.energy.deltaDays.down}일`],
        ctas: [cta("SLEEP_HYGIENE", "오늘 수면 루틴 1개 고정", "primary"), cta("BREATH_3M", "3분 호흡", "secondary")],
      }),
    },
    {
      id: "delta_up_strong",
      priority: 80,
      when: (s) => (s.energy.avgDailyDelta ?? 0) >= 0.6,
      build: (s) => ({
        title: "회복 요인이 반복되고 있어",
        message:
          "최근 기간에서 저녁 에너지가 더 높게 끝나는 날이 많아. 지금의 회복 조건을 ‘주제’와 같이 기록하면 재현이 쉬워진다.",
        evidence: [`평균 Δ: ${s.energy.avgDailyDelta}`, `상승일: ${s.energy.deltaDays.up}일`],
        ctas: [cta("REVIEW_TOPIC_TOP", "회복됐던 날 주제 확인하기", "primary"), cta("PLAN_RECOVERY_1", "내일 회복 1개 예약", "secondary")],
      }),
    },
    {
      id: "delta_volatile",
      priority: 70,
      when: (s) => s.energy.deltaType === "변동형",
      build: (s) => ({
        title: "상승/하락이 섞여 있어. 변수 1개만 줄이자",
        message:
          "평균만 보면 애매하지만 상승과 하락이 같이 나타나고 있어. ‘고정 루틴 1개’를 넣으면 원인 후보를 빠르게 걸러낼 수 있다.",
        evidence: [`상승/하락: ${s.energy.deltaDays.up}/${s.energy.deltaDays.down}일`],
        ctas: [cta("PLAN_RECOVERY_1", "내일 회복 루틴 1개 고정", "primary"), cta("WALK_10M", "10분 걷기", "secondary")],
      }),
    },
    {
      id: "mood_low",
      priority: 65,
      when: (s) => (s.mood.avgScore ?? 99) <= 3,
      build: (s) => ({
        title: "기분 점수가 낮은 구간이야",
        message: "에너지랑 별개로, 긴장 완충 행동(짧은 호흡/걷기)을 먼저 넣는 게 효율적이야.",
        evidence: [`평균 무드 점수: ${s.mood.avgScore}/8`],
        ctas: [cta("BREATH_3M", "3분 호흡", "primary"), cta("WALK_10M", "10분 걷기", "secondary")],
      }),
    },
    {
      id: "mood_high",
      priority: 55,
      when: (s) => (s.mood.avgScore ?? 0) >= 6,
      build: (s) => ({
        title: "기분 흐름은 꽤 안정적이야",
        message: "좋음 쪽 분포가 우세해. 저녁 기록을 빼먹지 않고 회복 조건을 계속 수집하면 더 좋아진다.",
        evidence: [`평균 무드 점수: ${s.mood.avgScore}/8`],
        ctas: [cta("WRITE_EVENING", "오늘 저녁 기록하기", "primary", { slot: "evening" }), cta("PLAN_RECOVERY_1", "내일 회복 1개 예약", "secondary")],
      }),
    },
    {
      id: "topic_skewed",
      priority: 60,
      when: (s) => (s.topic.top?.[0]?.ratio ?? 0) >= 0.6,
      build: (s) => {
        const top = s.topic.top[0];
        return {
          title: `이번 기간은 ‘${top.key}’에 많이 쏠렸어`,
          message:
            "주제가 쏠리면 에너지/기분 변동도 그 주제 영향일 가능성이 커져. ‘부하 1개 줄이기’나 ‘회복 1개 추가’를 실험해봐.",
          evidence: [`Top 주제: ${top.key} (${Math.round(top.ratio * 100)}%)`],
          ctas: [cta("REDUCE_LOAD_1", "부하 1개 줄이기", "primary", { topic: top.key }), cta("REVIEW_TOPIC_TOP", "해당 주제 모아보기", "secondary", { topic: top.key })],
        };
      },
    },
    {
      id: "stable_next_step",
      priority: 40,
      when: (s) => s.energy.deltaType === "안정형",
      build: () => ({
        title: "큰 변화는 없고, 이제는 ‘실험’이 효율적이야",
        message: "안정형이면 유지에는 강점이 있어. 다음 단계는 ‘작은 실험 1개’를 넣어서 더 좋아질 여지를 찾는 거다.",
        evidence: ["deltaType: 안정형"],
        ctas: [cta("PLAN_RECOVERY_1", "내일 작은 회복 실험 1개", "primary"), cta("WALK_10M", "10분 걷기 실험", "secondary")],
      }),
    },
    {
      id: "fallback",
      priority: 1,
      when: () => true,
      build: () => ({
        title: "다음 기록으로 패턴을 더 선명하게 만들자",
        message: "오늘은 기록 1회만 더 해도 다음 리포트 품질이 오른다.",
        evidence: [],
        ctas: [cta("WRITE_EVENING", "오늘 저녁 기록하기", "primary", { slot: "evening" })],
      }),
    },
  ];

  rules.sort((a, b) => b.priority - a.priority);
  return rules.find((r) => r.when(stats))!.build(stats);
}
