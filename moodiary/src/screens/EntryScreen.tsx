// /workspaces/maw/moodiary/src/screens/EntryScreen.tsx
import React, { useMemo, useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Chip,
  Divider,
  Text,
  TextInput,
  SegmentedButtons,
  Snackbar,
  IconButton,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../providers/AuthProvider";
import { useEntrySession } from "../query/useEntrySession";
import { useUserDoc } from "../query/useUserDoc";
import { upsertSession, deleteSessionById } from "../firebase/diaryRepo";
import { addTopicPreset } from "../firebase/userRepo";
import {
  EntrySlot,
  MoodKey,
  EnergyLevel,
  makeEntryId,
  ISODate,
  EntryId,
} from "../core/types";

const MOODS: { key: MoodKey; label: string }[] = [
  { key: "very_bad", label: "완전↓" },
  { key: "sad", label: "다운" },
  { key: "anxious", label: "불안" },
  { key: "angry", label: "짜증" },
  { key: "calm", label: "평온" },
  { key: "content", label: "만족" },
  { key: "good", label: "좋음" },
  { key: "very_good", label: "최고↑" },
];

const ENERGIES: { key: EnergyLevel; label: string }[] = [
  { key: 1, label: "1" },
  { key: 2, label: "2" },
  { key: 3, label: "3" },
  { key: 4, label: "4" },
  { key: 5, label: "5" },
];

// ✅ 기본 프리셋
const BASE_TOPIC_PRESETS = [
  "일/업무",
  "공부/성장",
  "운동/건강",
  "식사/체중",
  "수면",
  "가족",
  "연인/소개팅",
  "친구",
  "인간관계",
  "돈/소비",
  "취미/여가",
  "멘탈/불안",
] as const;

function ensureISODate(v: string): ISODate {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v as ISODate;
  return dayjs().format("YYYY-MM-DD") as ISODate;
}

function cleanTopics(input: string[]): string[] {
  const cleaned = input
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);
  // 중복 제거(순서 유지)
  return Array.from(new Set(cleaned));
}

export default function EntryScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const params = useLocalSearchParams();

  const date = useMemo(() => {
    const p =
      typeof params.date === "string" ? params.date : dayjs().format("YYYY-MM-DD");
    return ensureISODate(p);
  }, [params.date]);

  const slot = useMemo(() => {
    const p = typeof params.slot === "string" ? params.slot : "evening";
    return (p === "morning" ? "morning" : "evening") as EntrySlot;
  }, [params.slot]);

  const entryId: EntryId = useMemo(() => makeEntryId(date, slot), [date, slot]);

  // ✅ 코치 CTA 파라미터(선택)
  const ctaId = typeof params.ctaId === "string" ? params.ctaId : "";
  const ctaTopic = typeof params.ctaTopic === "string" ? params.ctaTopic : "";

  // ✅ userDoc에서 유저 커스텀 토픽 프리셋 로드
  const { data: userDoc } = useUserDoc(user?.uid ?? null);
  const userPresets = useMemo(() => cleanTopics(userDoc?.topicPresets ?? []), [userDoc?.topicPresets]);

  // ✅ 화면에 보여줄 프리셋 = 기본 + 유저 프리셋(중복 제거)
  const TOPIC_PRESETS = useMemo(() => {
    return Array.from(new Set([...BASE_TOPIC_PRESETS, ...userPresets]));
  }, [userPresets]);

  // ✅ EntryId 기준 훅
  const { data: existing, isLoading } = useEntrySession(user?.uid ?? null, entryId);

  const [mood, setMood] = useState<MoodKey>("calm");
  const [energy, setEnergy] = useState<EnergyLevel>(3);

  // ✅ 멀티 토픽
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicCustom, setTopicCustom] = useState<string>("");

  const [note, setNote] = useState<string>("");

  const [toastVisible, setToastVisible] = useState(false);
  const [err, setErr] = useState<string>("");

  // (선택) 안전장치: 최대 선택 개수
  const MAX_TOPICS = 5;

  const toggleTopic = (t: string) => {
    const topic = t.trim();
    if (!topic) return;

    setSelectedTopics((prev) => {
      const exists = prev.includes(topic);
      if (exists) return prev.filter((x) => x !== topic);

      if (prev.length >= MAX_TOPICS) {
        setErr(`토픽은 최대 ${MAX_TOPICS}개까지 선택 가능`);
        return prev;
      }
      return [...prev, topic];
    });
  };

  const addCustomTopic = async () => {
    if (!user?.uid) return;

    const t = topicCustom.trim();
    if (!t) {
      setErr("토픽을 입력해줘");
      return;
    }
    if (t.length < 2) {
      setErr("토픽은 2글자 이상으로 적어줘");
      return;
    }

    // 선택 목록에 추가(중복 제거, 최대치 체크)
    setSelectedTopics((prev) => {
      if (prev.includes(t)) return prev;
      if (prev.length >= MAX_TOPICS) {
        setErr(`토픽은 최대 ${MAX_TOPICS}개까지 선택 가능`);
        return prev;
      }
      return [...prev, t];
    });

    setTopicCustom("");

    // ✅ 유저 프리셋으로 저장(기본 프리셋에 없는 것만)
    const isBase = (BASE_TOPIC_PRESETS as readonly string[]).includes(t);
    if (!isBase) {
      try {
        await addTopicPreset(user.uid, t);
        // userDoc은 훅에서 자동으로 다시 가져올 수도 있고,
        // 아니면 invalidate해서 재조회 유도
        qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
      } catch (e: any) {
        // 저장 실패해도 기록 자체는 가능해야 하니, 치명 에러로 막지 않음
        setErr(e?.message ?? "토픽 저장 실패");
      }
    }
  };

  // 기존 데이터 로딩
  React.useEffect(() => {
    if (!existing) return;

    setMood(existing.mood);
    setEnergy(existing.energy);

    const topics =
      Array.isArray(existing.topics) && existing.topics.length > 0
        ? existing.topics
        : existing.topic
        ? [existing.topic]
        : [];

    setSelectedTopics(cleanTopics(topics));
    setNote(existing.note ?? "");
  }, [existing]);

  const onSave = async () => {
    if (!user?.uid) return;

    const topics = cleanTopics(selectedTopics);

    if (topics.length === 0) {
      setErr("topic을 1개 이상 선택해줘");
      return;
    }

    try {
      await upsertSession(user.uid, {
        date,
        slot,
        mood,
        energy,

        // ✅ v2: 멀티 토픽
        topics,

        // ✅ v1 레거시 호환: 첫 번째 토픽만 저장
        topic: topics[0] ?? "",

        note: note.trim(),
      });

      // ✅ 캐시 무효화
      qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
      qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

      setToastVisible(true);

      setTimeout(() => {
        router.replace({
          pathname: "/entry-detail",
          params: { entryId },
        });
      }, 250);
    } catch (e: any) {
      setErr(e?.message ?? "저장 실패");
    }
  };

  const onDelete = async () => {
    if (!user?.uid) return;

    try {
      await deleteSessionById(user.uid, entryId);

      qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
      qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

      router.back();
    } catch (e: any) {
      setErr(e?.message ?? "삭제 실패");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleMedium">
              {date} · {slot === "morning" ? "아침" : "저녁"}
            </Text>
            <Text style={{ opacity: 0.7 }}>
              하루의 변화(Delta)를 위해 아침/저녁을 분리해서 기록한다.
            </Text>
          </Card.Content>
        </Card>

        {/* ✅ CTA 힌트 배너(선택) */}
        {ctaId ? (
          <Card>
            <Card.Content style={{ gap: 6 }}>
              <Text variant="titleMedium">오늘의 행동 제안</Text>
              <Text style={{ opacity: 0.82 }}>
                {ctaId === "BREATH_3M" && "3분 호흡 후, 지금 상태를 한 줄로 적어봐."}
                {ctaId === "WALK_10M" && "10분 걷고 돌아와서 저녁 컨디션을 기록해봐."}
                {ctaId === "SLEEP_HYGIENE" && "오늘은 수면 루틴 1개만 고정해보자."}
                {ctaId === "PLAN_RECOVERY_1" && "내일 회복 행동 1개를 미리 예약해두자."}
                {ctaId === "REDUCE_LOAD_1" && `‘${ctaTopic || "주제"}’에서 부하 1개를 줄여보자.`}
                {(ctaId === "WRITE_MORNING" || ctaId === "WRITE_EVENING") &&
                  "기록 1회만 더 해도 리포트가 선명해진다."}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">Mood</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MOODS.map((m) => (
                <Chip
                  key={m.key}
                  selected={mood === m.key}
                  onPress={() => setMood(m.key)}
                >
                  {m.label}
                </Chip>
              ))}
            </View>

            <Divider />

            <Text variant="titleMedium">Energy (1~5)</Text>
            <SegmentedButtons
              value={String(energy)}
              onValueChange={(v) => setEnergy(Number(v) as EnergyLevel)}
              buttons={ENERGIES.map((e) => ({ value: String(e.key), label: e.label }))}
            />

            <Divider />

            <Text variant="titleMedium">
              Topic (다중 선택 · 최대 {MAX_TOPICS}개)
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TOPIC_PRESETS.map((t) => (
                <Chip
                  key={t}
                  selected={selectedTopics.includes(t)}
                  onPress={() => toggleTopic(t)}
                >
                  {t}
                </Chip>
              ))}
            </View>

            {/* ✅ 커스텀 토픽 추가 */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  value={topicCustom}
                  onChangeText={setTopicCustom}
                  placeholder="새 토픽 추가 (예: 이직, 병원, 이사...)"
                  onSubmitEditing={addCustomTopic}
                  returnKeyType="done"
                />
              </View>
              <IconButton icon="plus" onPress={addCustomTopic} />
            </View>

            {/* 선택된 토픽 미리보기 */}
            <Text style={{ opacity: 0.7 }}>
              선택됨: {selectedTopics.length > 0 ? selectedTopics.join(", ") : "—"}
            </Text>

            <Divider />

            <Text variant="titleMedium">Note</Text>
            <TextInput
              mode="outlined"
              value={note}
              onChangeText={setNote}
              placeholder="한 줄 메모"
              multiline
            />
          </Card.Content>
        </Card>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            mode="contained"
            onPress={onSave}
            loading={isLoading}
            style={{ flex: 1 }}
          >
            저장
          </Button>
          {!!existing ? (
            <Button mode="outlined" onPress={onDelete}>
              삭제
            </Button>
          ) : null}
        </View>

        <Snackbar visible={toastVisible} onDismiss={() => setToastVisible(false)}>
          저장 완료
        </Snackbar>
        <Snackbar visible={!!err} onDismiss={() => setErr("")}>
          {err}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
