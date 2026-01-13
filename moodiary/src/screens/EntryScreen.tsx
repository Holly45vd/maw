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

// ✅ SVG 아이콘 (파일명 정확히!)
import VeryBadIcon from "../../assets/mood/very_bad.svg";
import SadIcon from "../../assets/mood/sad.svg";
import AnxiousIcon from "../../assets/mood/anxious.svg";
import CalmIcon from "../../assets/mood/calm.svg";
import ContentIcon from "../../assets/mood/content.svg";
import GoodIcon from "../../assets/mood/good.svg";
import VeryGoodIcon from "../../assets/mood/verygood.svg";

// (선택) angry 아이콘 없으면 그냥 텍스트로 둬도 됨
// import AngryIcon from "../../assets/mood/angry.svg";

const MOODS: { key: MoodKey; label: string; Icon?: React.ComponentType<any> }[] =
  [
    { key: "very_bad", label: "완전↓", Icon: VeryBadIcon },
    { key: "sad", label: "다운", Icon: SadIcon },
    { key: "anxious", label: "불안", Icon: AnxiousIcon },
    { key: "angry", label: "짜증" }, // 아이콘 없으면 OK
    { key: "calm", label: "평온", Icon: CalmIcon },
    { key: "content", label: "만족", Icon: ContentIcon },
    { key: "good", label: "좋음", Icon: GoodIcon },
    { key: "very_good", label: "최고↑", Icon: VeryGoodIcon },
  ];

const ENERGIES: { key: EnergyLevel; label: string }[] = [
  { key: 1, label: "1" },
  { key: 2, label: "2" },
  { key: 3, label: "3" },
  { key: 4, label: "4" },
  { key: 5, label: "5" },
];

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
  const cleaned = input.map((t) => String(t ?? "").trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

export default function EntryScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const params = useLocalSearchParams();

  const date = useMemo(() => {
    const p =
      typeof params.date === "string"
        ? params.date
        : dayjs().format("YYYY-MM-DD");
    return ensureISODate(p);
  }, [params.date]);

  const slot = useMemo(() => {
    const p = typeof params.slot === "string" ? params.slot : "evening";
    return (p === "morning" ? "morning" : "evening") as EntrySlot;
  }, [params.slot]);

  const entryId: EntryId = useMemo(() => makeEntryId(date, slot), [date, slot]);

  const ctaId = typeof params.ctaId === "string" ? params.ctaId : "";
  const ctaTopic = typeof params.ctaTopic === "string" ? params.ctaTopic : "";

  const { data: userDoc } = useUserDoc(user?.uid ?? null);
  const userPresets = useMemo(
    () => cleanTopics(userDoc?.topicPresets ?? []),
    [userDoc?.topicPresets]
  );

  const TOPIC_PRESETS = useMemo(() => {
    return Array.from(new Set([...BASE_TOPIC_PRESETS, ...userPresets]));
  }, [userPresets]);

  const { data: existing, isLoading } = useEntrySession(
    user?.uid ?? null,
    entryId
  );

  const [mood, setMood] = useState<MoodKey>("calm");
  const [energy, setEnergy] = useState<EnergyLevel>(3);

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicCustom, setTopicCustom] = useState<string>("");

  const [note, setNote] = useState<string>("");

  const [toastVisible, setToastVisible] = useState(false);
  const [err, setErr] = useState<string>("");

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
    if (!t) return setErr("토픽을 입력해줘");
    if (t.length < 2) return setErr("토픽은 2글자 이상으로 적어줘");

    setSelectedTopics((prev) => {
      if (prev.includes(t)) return prev;
      if (prev.length >= MAX_TOPICS) {
        setErr(`토픽은 최대 ${MAX_TOPICS}개까지 선택 가능`);
        return prev;
      }
      return [...prev, t];
    });

    setTopicCustom("");

    const isBase = (BASE_TOPIC_PRESETS as readonly string[]).includes(t);
    if (!isBase) {
      try {
        await addTopicPreset(user.uid, t);
        qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
      } catch (e: any) {
        setErr(e?.message ?? "토픽 저장 실패");
      }
    }
  };

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
    if (topics.length === 0) return setErr("topic을 1개 이상 선택해줘");

    try {
      await upsertSession(user.uid, {
        date,
        slot,
        mood,
        energy,
        topics,
        topic: topics[0] ?? "",
        note: note.trim(),
      });

      qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
      qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

      setToastVisible(true);

      setTimeout(() => {
        router.replace({ pathname: "/entry-detail", params: { entryId } });
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
              {MOODS.map((m) => {
                const Icon = m.Icon;
                return (
                  <Chip
                    key={m.key}
                    selected={mood === m.key}
                    onPress={() => setMood(m.key)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {Icon ? <Icon width={18} height={18} /> : null}
                      <Text>{m.label}</Text>
                    </View>
                  </Chip>
                );
              })}
            </View>

            <Divider />

            <Text variant="titleMedium">Energy (1~5)</Text>
            <SegmentedButtons
              value={String(energy)}
              onValueChange={(v) => setEnergy(Number(v) as EnergyLevel)}
              buttons={ENERGIES.map((e) => ({ value: String(e.key), label: e.label }))}
            />

            <Divider />

            <Text variant="titleMedium">Topic (다중 선택 · 최대 {MAX_TOPICS}개)</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TOPIC_PRESETS.map((t) => (
                <Chip key={t} selected={selectedTopics.includes(t)} onPress={() => toggleTopic(t)}>
                  {t}
                </Chip>
              ))}
            </View>

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
          <Button mode="contained" onPress={onSave} loading={isLoading} style={{ flex: 1 }}>
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
