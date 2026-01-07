import { EntrySession } from "./types";

type Badge = { key: string; label: string; tone: "good" | "neutral" | "bad" };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function buildDailyInsight(input: {
  morning: EntrySession | null;
  evening: EntrySession | null;
}): { line: string; badges: Badge[] } {
  const { morning, evening } = input;

  // 기본
  if (!morning && !evening) {
    return {
      line: "아직 기록이 없다. 아침 또는 저녁부터 가볍게 시작해봐.",
      badges: [{ key: "no_record", label: "미기록", tone: "neutral" }],
    };
  }

  if (morning && !evening) {
    return {
      line: "아침 기록은 완료. 저녁까지 채우면 ‘변화’가 완성된다.",
      badges: [{ key: "half", label: "부분 기록", tone: "neutral" }],
    };
  }

  if (!morning && evening) {
    return {
      line: "저녁 기록은 완료. 아침을 추가하면 하루 변화가 더 선명해진다.",
      badges: [{ key: "half", label: "부분 기록", tone: "neutral" }],
    };
  }

  // 여기부터 morning+evening 모두 있는 경우
  const delta = (evening!.energy ?? 0) - (morning!.energy ?? 0);
  const abs = Math.abs(delta);

  // 1) 한 줄 요약 (근거 기반, 과장 금지)
  let line = "오늘은 변화가 크지 않았어. 유지하는 힘도 실력이다.";
  if (delta >= 2) line = "아침보다 저녁 에너지가 확실히 높아졌어. 회복한 날이다.";
  else if (delta === 1) line = "아침보다 저녁 에너지가 조금 올랐어. 흐름이 괜찮다.";
  else if (delta === 0) line = "아침과 저녁 에너지가 비슷했어. 안정적인 하루다.";
  else if (delta === -1) line = "저녁에 에너지가 조금 줄었어. 소모가 있었던 날이다.";
  else if (delta <= -2) line = "저녁에 에너지가 크게 줄었어. 무리했을 가능성이 크다.";

  // 2) 배지(패턴) 만들기
  const badges: Badge[] = [];

  // 회복/소모/안정
  if (delta >= 1) badges.push({ key: "recover", label: "회복형 하루", tone: "good" });
  else if (delta <= -1) badges.push({ key: "drain", label: "소모형 하루", tone: "bad" });
  else badges.push({ key: "stable", label: "안정형 하루", tone: "neutral" });

  // 변화 크기(옵션)
  if (abs >= 2) badges.push({ key: "big_delta", label: "변화 큼", tone: delta > 0 ? "good" : "bad" });

  // 주제 집중
  const mt = (morning!.topic ?? "").trim();
  const et = (evening!.topic ?? "").trim();
  if (mt && et && mt === et) {
    badges.push({ key: "focus", label: `${mt} 집중`, tone: "neutral" });
  }

  // 에너지 수준 배지(아침/저녁 평균 기반)
  const avg = clamp(((morning!.energy ?? 0) + (evening!.energy ?? 0)) / 2, 1, 5);
  if (avg >= 4) badges.push({ key: "high_energy", label: "고에너지", tone: "good" });
  else if (avg <= 2) badges.push({ key: "low_energy", label: "저에너지", tone: "bad" });

  // 최대 3개만(깔끔하게)
  return { line, badges: badges.slice(0, 3) };
}
