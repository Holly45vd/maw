// src/screens/EntryScreen.tsx
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
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../providers/AuthProvider";
import { useEntrySession } from "../query/useEntrySession";
import { upsertSession, deleteSession } from "../firebase/diaryRepo";
import { EntrySlot, MoodKey, EnergyLevel, makeEntryId } from "../core/types";

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

export default function EntryScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const params = useLocalSearchParams();
  const date = useMemo(() => {
    const p = typeof params.date === "string" ? params.date : dayjs().format("YYYY-MM-DD");
    return p;
  }, [params.date]);

  const slot = useMemo(() => {
    const p = typeof params.slot === "string" ? params.slot : "evening";
    return (p === "morning" ? "morning" : "evening") as EntrySlot;
  }, [params.slot]);

  // ✅ 코치 CTA 파라미터(선택)
  const ctaId = typeof params.ctaId === "string" ? params.ctaId : "";
  const ctaTopic = typeof params.ctaTopic === "string" ? params.ctaTopic : "";

  const { data: existing, isLoading } = useEntrySession(user?.uid ?? null, date, slot);

  const [mood, setMood] = useState<MoodKey>("calm");
  const [energy, setEnergy] = useState<EnergyLevel>(3);
  const [topic, setTopic] = useState<string>(""); // v1 단일 선택 유지
  const [note, setNote] = useState<string>("");

  const [toastVisible, setToastVisible] = useState(false);
  const [err, setErr] = useState<string>("");

  // 기존 데이터 로딩
  React.useEffect(() => {
    if (!existing) return;
    setMood(existing.mood);
    setEnergy(existing.energy);
    setTopic(existing.topic ?? "");
    setNote(existing.note ?? "");
  }, [existing]);

  const onSave = async () => {
    if (!user?.uid) return;
    if (!topic.trim()) {
      setErr("topic을 선택/입력해줘");
      return;
    }

    try {
      await upsertSession(user.uid, {
        date,
        slot,
        mood,
        energy,

        // ✅ v2 호환 저장: topics[] + 레거시 topic 동시 저장
        topics: [topic.trim()],
        topic: topic.trim(),

        note: note.trim(),
      });

      // ✅ Home(todaySessions) 즉시 갱신
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });

      // ✅ Calendar(monthSessions) 즉시 갱신
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });

      setToastVisible(true);

      const entryId = makeEntryId(date, slot);
      setTimeout(() => {
        router.replace({
          pathname: "/(tabs)/entry-detail",
          params: { entryId },
        });
      }, 300);
    } catch (e: any) {
      setErr(e?.message ?? "저장 실패");
    }
  };

  const onDelete = async () => {
    if (!user?.uid) return;
    try {
      await deleteSession(user.uid, date, slot);
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
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
            <Text variant="titleMedium">{date} · {slot === "morning" ? "아침" : "저녁"}</Text>
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

            <Text variant="titleMedium">Topic (v1 단일)</Text>
            <TextInput
              mode="outlined"
              value={topic}
              onChangeText={setTopic}
              placeholder="예: 일, 운동, 가족, 인간관계..."
            />

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
