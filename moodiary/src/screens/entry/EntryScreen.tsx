// src/screens/entry/EntryScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { Button, Snackbar, useTheme } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../providers/AuthProvider";
import { useEntrySession } from "../../query/useEntrySession";
import { useUserDoc } from "../../query/useUserDoc";
import { upsertSession, deleteSessionById } from "../../firebase/diaryRepo";
import { addTopicPreset } from "../../firebase/userRepo";
import type { EntryId, EntrySlot, ISODate } from "../../core/types";
import { makeEntryId } from "../../core/types";

import DayIcon from "../../../assets/mood/day.svg";
import NightIcon from "../../../assets/mood/night.svg";

import EntryStickyHeader from "./components/EntryStickyHeader";
import MoodSection from "./components/MoodSection";
import EnergySection from "./components/EnergySection";
import TopicSection from "./components/TopicSection";
import NoteSection from "./components/NoteSection";
import { useEntryForm } from "./hooks/useEntryForm";

function ensureISODate(v: string): ISODate {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v as ISODate;
  return dayjs().format("YYYY-MM-DD") as ISODate;
}

function cleanTopics(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input.map((t) => String(t ?? "").trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

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

export default function EntryScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const bg = colors.background;

  // ---- route params ----
  const date = useMemo(() => {
    const raw = typeof params.date === "string" ? params.date : dayjs().format("YYYY-MM-DD");
    return ensureISODate(raw);
  }, [params.date]);

  const slot = useMemo<EntrySlot>(() => {
    const raw = typeof params.slot === "string" ? params.slot : "evening";
    return raw === "morning" ? "morning" : "evening";
  }, [params.slot]);

  const entryId = useMemo<EntryId>(() => makeEntryId(date, slot), [date, slot]);

  // ---- user doc (토픽 프리셋 확장) ----
  const { data: userDoc } = useUserDoc(user?.uid ?? null);
  const userPresets = useMemo(() => cleanTopics((userDoc as any)?.topicPresets ?? []), [(userDoc as any)?.topicPresets]);

  const TOPIC_PRESETS = useMemo(() => {
    return Array.from(new Set([...BASE_TOPIC_PRESETS, ...userPresets]));
  }, [userPresets]);

  // ---- existing session ----
  const { data: existing, isLoading } = useEntrySession(user?.uid ?? null, entryId);

  // ---- form hook ----
  const f = useEntryForm(existing);

  // ---- ui states ----
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [err, setErr] = useState("");

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showError = (msg: string) => setErr(msg);

  // ---- header computed ----
  const weekdayKo = useMemo(() => {
    const w = ["일", "월", "화", "수", "목", "금", "토"];
    return w[dayjs(date).day()];
  }, [date]);

  const SlotIcon = slot === "morning" ? DayIcon : NightIcon;
  const slotLabel = slot === "morning" ? "오전" : "오후";
  const dateText = `${date} (${weekdayKo})`;

  // ---- topic handlers ----
  const toggleTopic = (t: string) => {
    const topic = t.trim();
    if (!topic) return;

    f.setSelectedTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((x) => x !== topic);
      if (prev.length >= f.MAX_TOPICS) {
        showError(`토픽은 최대 ${f.MAX_TOPICS}개까지 선택 가능`);
        return prev;
      }
      return [...prev, topic];
    });
  };

  const addCustomTopic = async () => {
    if (!user?.uid) return;

    const t = f.topicCustom.trim();
    if (!t) return showError("토픽을 입력해줘");
    if (t.length < 2) return showError("토픽은 2글자 이상으로 적어줘");
    if (t.length > 20) return showError("토픽은 20글자 이내로 적어줘");

    f.setSelectedTopics((prev) => {
      if (prev.includes(t)) return prev;
      if (prev.length >= f.MAX_TOPICS) {
        showError(`토픽은 최대 ${f.MAX_TOPICS}개까지 선택 가능`);
        return prev;
      }
      return [...prev, t];
    });

    f.setTopicCustom("");

    const isBase = (BASE_TOPIC_PRESETS as readonly string[]).includes(t);
    if (!isBase) {
      try {
        await addTopicPreset(user.uid, t);
        qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
      } catch (e: any) {
        showError(e?.message ?? "토픽 저장 실패");
      }
    }
  };

  // ---- save/delete ----
  const onSave = async () => {
    if (!user?.uid) return showError("로그인이 필요해");

    const msg = f.validate();
    if (msg) return showError(msg);

    setSaving(true);
    try {
      await upsertSession(user.uid, {
        date,
        slot,
        mood: f.mood,
        energy: f.energy,
        topics: f.topicsCleaned,
        topic: f.topicsCleaned[0] ?? "",
        note: f.trimmedNote,
      });

      qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
      qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

      setToastVisible(true);

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        router.replace({ pathname: "/entry-detail", params: { entryId } });
      }, 250);
    } catch (e: any) {
      showError(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await deleteSessionById(user.uid, entryId);

      qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
      qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
      qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
      qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

      router.back();
    } catch (e: any) {
      showError(e?.message ?? "삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        stickyHeaderIndices={[0]}
        style={{ backgroundColor: bg }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingTop: 0, backgroundColor: bg }}
      >
        <EntryStickyHeader
          dateText={dateText}
          slotLabel={slotLabel}
          SlotIcon={SlotIcon}
          saving={saving}
          onSave={onSave}
        />

        <MoodSection mood={f.mood} onChange={f.setMood} />
        <EnergySection energy={f.energy} onChange={f.setEnergy} />

        <TopicSection
          presets={TOPIC_PRESETS}
          selectedTopics={f.selectedTopics}
          maxTopics={f.MAX_TOPICS}
          topicsCleaned={f.topicsCleaned}
          topicCustom={f.topicCustom}
          onChangeTopicCustom={f.setTopicCustom}
          onToggleTopic={toggleTopic}
          onAddCustomTopic={addCustomTopic}
        />

        <NoteSection
          note={f.note}
          onChange={f.setNote}
          noteMax={f.NOTE_MAX}
          trimmedLength={f.trimmedNote.length}
        />

        {!!existing ? (
          <View style={{ alignItems: "flex-end" }}>
            <Button
              mode="outlined"
              onPress={onDelete}
              disabled={saving || isLoading}
              loading={saving && !toastVisible}
              style={{ borderRadius: 10 }}
            >
              삭제
            </Button>
          </View>
        ) : null}

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
