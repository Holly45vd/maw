// src/screens/entry/hooks/useEntryForm.ts
import { useEffect, useMemo, useState } from "react";
import type { EnergyLevel, MoodKey } from "../../../core/types";

function cleanTopics(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input.map((t) => String(t ?? "").trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

export function useEntryForm(existing: any | undefined) {
  const MAX_TOPICS = 5;
  const NOTE_MAX = 300;

  const [mood, setMood] = useState<MoodKey>("calm");
  const [energy, setEnergy] = useState<EnergyLevel>(3);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicCustom, setTopicCustom] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!existing) return;

    setMood(existing.mood);
    setEnergy(existing.energy);

    const topics =
      Array.isArray(existing.topics) && existing.topics.length > 0
        ? existing.topics
        : typeof existing.topic === "string" && existing.topic.trim()
        ? [existing.topic]
        : [];

    setSelectedTopics(cleanTopics(topics));
    setNote(String(existing.note ?? ""));
  }, [existing]);

  const topicsCleaned = useMemo(() => cleanTopics(selectedTopics), [selectedTopics]);
  const trimmedNote = useMemo(() => note.trim(), [note]);

  const validate = () => {
    if (topicsCleaned.length < 1) return "토픽을 1개 이상 선택해줘";
    if (topicsCleaned.length > MAX_TOPICS) return `토픽은 최대 ${MAX_TOPICS}개까지 가능`;
    if (trimmedNote.length > NOTE_MAX) return `메모는 ${NOTE_MAX}자 이내로 적어줘`;
    return "";
  };

  return {
    // constants
    MAX_TOPICS,
    NOTE_MAX,

    // state
    mood,
    setMood,
    energy,
    setEnergy,
    selectedTopics,
    setSelectedTopics,
    topicCustom,
    setTopicCustom,
    note,
    setNote,

    // derived
    topicsCleaned,
    trimmedNote,

    // validation
    validate,
  };
}
