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
import { upsertSession } from "../firebase/diaryRepo";
import { EntrySlot, MoodKey, EnergyLevel } from "../core/types";

/** URL params: /...(tabs)/entry?date=YYYY-MM-DD&slot=morning|evening */
function pickSlot(v: any): EntrySlot {
  return v === "evening" ? "evening" : "morning";
}
function pickDate(v: any): string {
  const s = typeof v === "string" ? v : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return dayjs().format("YYYY-MM-DD");
}

const MOODS: Array<{ key: MoodKey; label: string }> = [
  { key: "very_bad", label: "완전↓" },
  { key: "sad", label: "다운" },
  { key: "anxious", label: "불안" },
  { key: "angry", label: "짜증" },
  { key: "calm", label: "평온" },
  { key: "content", label: "만족" },
  { key: "good", label: "좋음" },
  { key: "very_good", label: "최고↑" },
];

const TOPICS = ["일", "관계", "건강", "돈", "나", "가족", "공부", "취미"] as const;

export default function EntryScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const params = useLocalSearchParams();
  const date = useMemo(() => pickDate(params.date), [params.date]);
  const slot = useMemo(() => pickSlot(params.slot), [params.slot]);

  const slotLabel = slot === "morning" ? "아침" : "저녁";
  const isToday = date === dayjs().format("YYYY-MM-DD");
  const isFuture = useMemo(() => dayjs(date).isAfter(dayjs(), "day"), [date]);

  const title = isToday
    ? `${slotLabel} 기록`
    : `${dayjs(date).format("M/D")} ${slotLabel} 회고`;

  // 입력값
  const [mood, setMood] = useState<MoodKey>("good");
  const [energy, setEnergy] = useState<EnergyLevel>(3);
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [note, setNote] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const canSave = !!user?.uid && !!mood && !!energy && !!topic && !isFuture;

  const onSave = async () => {
    if (!user?.uid) return;
    if (isFuture) return;

    setSaving(true);
    try {
      await upsertSession(user.uid, {
        date,
        slot,
        mood,
        energy,
        topic,
        note: note.trim(),
      });

      // ✅ Home(todaySessions) 즉시 갱신
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });

      // ✅ Calendar(monthSessions) 즉시 갱신 (이게 핵심)
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });

      // 등록 팝업
      setToastVisible(true);

      // 디테일로 이동
      const entryId = `${date}_${slot}`;
      setTimeout(() => {
        router.replace({
          pathname: "/(tabs)/entry-detail",
          params: { entryId },
        });
      }, 700);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 4 }}>
          <Text variant="headlineMedium">{title}</Text>
          <Text style={{ opacity: 0.7 }}>{date}</Text>
          {isFuture && (
            <Text style={{ color: "#d32f2f" }}>
              미래 날짜에는 기록할 수 없습니다.
            </Text>
          )}
        </View>

        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">기분</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MOODS.map((m) => (
                <Chip
                  key={m.key}
                  selected={mood === m.key}
                  onPress={() => setMood(m.key)}
                  style={{ width: "23%", justifyContent: "center" }}
                >
                  {m.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">에너지 (1~5)</Text>
            <SegmentedButtons
              value={String(energy)}
              onValueChange={(v) => setEnergy(Number(v) as EnergyLevel)}
              buttons={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
              ]}
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">주제</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TOPICS.map((t) => (
                <Chip key={t} selected={topic === t} onPress={() => setTopic(t)}>
                  {t}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">메모 (선택)</Text>
            <TextInput
              mode="outlined"
              value={note}
              onChangeText={setNote}
              placeholder="한 줄 회고를 남겨도 좋고, 비워도 된다."
              multiline
              numberOfLines={5}
            />
          </Card.Content>
        </Card>

        <Divider />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            mode="outlined"
            style={{ flex: 1 }}
            onPress={() => router.back()}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            mode="contained"
            style={{ flex: 1 }}
            loading={saving}
            disabled={!canSave || saving}
            onPress={onSave}
          >
            저장
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        duration={800}
      >
        등록되었습니다
      </Snackbar>
    </KeyboardAvoidingView>
  );
}
