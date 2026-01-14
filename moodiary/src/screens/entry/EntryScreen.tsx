// src/screens/entry/EntryScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import {
  Button,
  Dialog,
  Menu,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  "Work",
  "Study",
  "Workout",
  "Meal / Weight",
  "Sleep",
  "Family",
  "Dating / Relationship",
  "Friends",
  "People",
  "Money",
  "Hobby",
  "Mental / Anxiety",
] as const;

export default function EntryScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const bg = colors.background;

  // ---- route params ----
  const date = useMemo(() => {
    const raw =
      typeof params.date === "string" ? params.date : dayjs().format("YYYY-MM-DD");
    return ensureISODate(raw);
  }, [params.date]);

  const slot = useMemo<EntrySlot>(() => {
    const raw = typeof params.slot === "string" ? params.slot : "evening";
    return raw === "morning" ? "morning" : "evening";
  }, [params.slot]);

  const entryId = useMemo<EntryId>(() => makeEntryId(date, slot), [date, slot]);

  // ---- date picker dialog ----
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  // mobile(DateTimePicker) draft
  const [dateDraftObj, setDateDraftObj] = useState<Date>(() => dayjs(date).toDate());

  // web(Year/Month/Day menus) draft
  const [yMenu, setYMenu] = useState(false);
  const [mMenu, setMMenu] = useState(false);
  const [dMenu, setDMenu] = useState(false);

  const [pickedYear, setPickedYear] = useState<number>(() => dayjs(date).year());
  const [pickedMonth, setPickedMonth] = useState<number>(() => dayjs(date).month() + 1); // 1~12
  const [pickedDay, setPickedDay] = useState<number>(() => dayjs(date).date());

  useEffect(() => {
    // route date 바뀌면 draft를 동기화
    const cur = dayjs(date);
    setDateDraftObj(cur.toDate());
    setPickedYear(cur.year());
    setPickedMonth(cur.month() + 1);
    setPickedDay(cur.date());
  }, [date]);

  const openDateDialog = () => {
    const cur = dayjs(date);
    setDateDraftObj(cur.toDate());
    setPickedYear(cur.year());
    setPickedMonth(cur.month() + 1);
    setPickedDay(cur.date());
    setDateDialogOpen(true);
  };

  const closeDateDialog = () => {
    setDateDialogOpen(false);
    setYMenu(false);
    setMMenu(false);
    setDMenu(false);
  };

  const applyNextDate = (nextISO: ISODate) => {
    closeDateDialog();
    if (nextISO === date) return;
    router.replace({ pathname: "/(tabs)/entry", params: { date: nextISO, slot } });
  };

  const applyDateDraft = () => {
    // mobile용
    const next = dayjs(dateDraftObj).format("YYYY-MM-DD") as ISODate;
    applyNextDate(next);
  };

  const applyWebDraft = () => {
    // web용 (Y/M/D)
    const mm = String(pickedMonth).padStart(2, "0");
    const dd = String(pickedDay).padStart(2, "0");
    const next = `${pickedYear}-${mm}-${dd}` as ISODate;
    applyNextDate(next);
  };

  const webDaysInMonth = useMemo(() => {
    const mm = String(pickedMonth).padStart(2, "0");
    return dayjs(`${pickedYear}-${mm}-01`).daysInMonth();
  }, [pickedYear, pickedMonth]);

  useEffect(() => {
    // 월 바뀌어서 일수가 줄어든 경우 day 보정
    if (pickedDay > webDaysInMonth) setPickedDay(webDaysInMonth);
  }, [webDaysInMonth, pickedDay]);

  // ---- user doc (topic presets) ----
  const { data: userDoc } = useUserDoc(user?.uid ?? null);
  const userPresets = useMemo(
    () => cleanTopics((userDoc as any)?.topicPresets ?? []),
    [(userDoc as any)?.topicPresets]
  );
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
  const weekday = useMemo(() => {
    const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return w[dayjs(date).day()];
  }, [date]);

  const SlotIcon = slot === "morning" ? DayIcon : NightIcon;
  const dateText = `${date} (${weekday})`;

  // ---- topic handlers ----
  const toggleTopic = (t: string) => {
    const topic = t.trim();
    if (!topic) return;

    f.setSelectedTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((x) => x !== topic);
      if (prev.length >= f.MAX_TOPICS) {
        showError(`You can select up to ${f.MAX_TOPICS} topics`);
        return prev;
      }
      return [...prev, topic];
    });
  };

  const addCustomTopic = async () => {
    if (!user?.uid) return;

    const t = f.topicCustom.trim();
    if (!t) return showError("Type a topic");
    if (t.length < 2) return showError("Topic must be at least 2 characters");
    if (t.length > 20) return showError("Topic must be within 20 characters");

    f.setSelectedTopics((prev) => {
      if (prev.includes(t)) return prev;
      if (prev.length >= f.MAX_TOPICS) {
        showError(`You can select up to ${f.MAX_TOPICS} topics`);
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
        showError(e?.message ?? "Failed to save topic preset");
      }
    }
  };

  // ---- save/delete ----
  const onSave = async () => {
    if (!user?.uid) return showError("Login required");

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
      showError(e?.message ?? "Save failed");
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
      showError(e?.message ?? "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const onChangeSlot = (next: EntrySlot) => {
    if (next === slot) return;
    router.replace({ pathname: "/(tabs)/entry", params: { date, slot: next } });
  };

  // year options for web menu
  const yearOptions = useMemo(() => {
    const nowY = dayjs().year();
    // 현재년 기준 -5 ~ +3 (원하면 늘려)
    return Array.from({ length: 9 }, (_, i) => nowY - 5 + i);
  }, []);

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
          slot={slot}
          SlotIcon={SlotIcon}
          MorningIcon={DayIcon}
          EveningIcon={NightIcon}
          saving={saving}
          onSave={onSave}
          onChangeSlot={onChangeSlot}
          onPressDate={openDateDialog}
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
              Delete
            </Button>
          </View>
        ) : null}

        <Snackbar visible={toastVisible} onDismiss={() => setToastVisible(false)}>
          Saved
        </Snackbar>

        <Snackbar visible={!!err} onDismiss={() => setErr("")}>
          {err}
        </Snackbar>

        {/* ✅ Date Picker Dialog (WEB fallback included) */}
        <Portal>
          <Dialog visible={dateDialogOpen} onDismiss={closeDateDialog}>
            <Dialog.Title>Select date</Dialog.Title>

            <Dialog.Content>
              {Platform.OS === "web" ? (
                <View style={{ gap: 12, paddingTop: 6 }}>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    {/* Year */}
                    <Menu
                      visible={yMenu}
                      onDismiss={() => setYMenu(false)}
                      anchor={
                        <Button mode="outlined" onPress={() => setYMenu(true)}>
                          {pickedYear}
                        </Button>
                      }
                    >
                      {yearOptions.map((y) => (
                        <Menu.Item
                          key={y}
                          onPress={() => {
                            setPickedYear(y);
                            setYMenu(false);
                          }}
                          title={`${y}`}
                        />
                      ))}
                    </Menu>

                    {/* Month */}
                    <Menu
                      visible={mMenu}
                      onDismiss={() => setMMenu(false)}
                      anchor={
                        <Button mode="outlined" onPress={() => setMMenu(true)}>
                          {pickedMonth}
                        </Button>
                      }
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <Menu.Item
                          key={m}
                          onPress={() => {
                            setPickedMonth(m);
                            setMMenu(false);
                          }}
                          title={`${m}`}
                        />
                      ))}
                    </Menu>

                    {/* Day */}
                    <Menu
                      visible={dMenu}
                      onDismiss={() => setDMenu(false)}
                      anchor={
                        <Button mode="outlined" onPress={() => setDMenu(true)}>
                          {pickedDay}
                        </Button>
                      }
                    >
                      {Array.from({ length: webDaysInMonth }, (_, i) => i + 1).map((d) => (
                        <Menu.Item
                          key={d}
                          onPress={() => {
                            setPickedDay(d);
                            setDMenu(false);
                          }}
                          title={`${d}`}
                        />
                      ))}
                    </Menu>
                  </View>

                  <Text style={{ opacity: 0.7 }}>
                    {`${pickedYear}-${String(pickedMonth).padStart(2, "0")}-${String(pickedDay).padStart(2, "0")}`}
                  </Text>
                </View>
              ) : (
                <View style={{ paddingTop: 6 }}>
                  <DateTimePicker
                    value={dateDraftObj}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "spinner"}
                    onChange={(_, selected) => {
                      if (selected) setDateDraftObj(selected);
                    }}
                  />
                </View>
              )}
            </Dialog.Content>

            <Dialog.Actions>
              <Button onPress={closeDateDialog}>Cancel</Button>
              <Button onPress={Platform.OS === "web" ? applyWebDraft : applyDateDraft}>
                Apply
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
