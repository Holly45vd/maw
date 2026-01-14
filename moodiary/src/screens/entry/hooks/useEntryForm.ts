// src/screens/entry/hooks/useEntryForm.ts
import { useEffect, useMemo, useState } from "react";
import type { MoodKey, EnergyLevel } from "../../../core/types";

type EntryLike =
  | {
      mood?: MoodKey;
      energy?: EnergyLevel;
      topics?: string[];
      note?: string;
    }
  | null
  | undefined;

const DEFAULT_MOOD: MoodKey = "neutral";
const DEFAULT_ENERGY: EnergyLevel = 3;

export function useEntryForm(existing: EntryLike) {
  // limits
  const NOTE_MAX = 500;
  const MAX_TOPICS = 5;

  // form states
  const [mood, setMood] = useState<MoodKey>(DEFAULT_MOOD);
  const [energy, setEnergy] = useState<EnergyLevel>(DEFAULT_ENERGY);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicCustom, setTopicCustom] = useState("");
  const [note, setNote] = useState("");

  // ✅ existing 변경 시 폼을 재주입/리셋
  useEffect(() => {
    if (existing) {
      setMood((existing.mood ?? DEFAULT_MOOD) as MoodKey);
      setEnergy((existing.energy ?? DEFAULT_ENERGY) as EnergyLevel);
      setSelectedTopics(Array.isArray(existing.topics) ? existing.topics : []);
      setNote(typeof existing.note === "string" ? existing.note : "");
      setTopicCustom("");
    } else {
      // no saved data => reset defaults
      setMood(DEFAULT_MOOD);
      setEnergy(DEFAULT_ENERGY);
      setSelectedTopics([]);
      setNote("");
      setTopicCustom("");
    }
  }, [
    // dependency를 “내용 기반”으로 잡아야 확실히 바뀜
    existing ? JSON.stringify(existing) : "EMPTY",
  ]);

  const trimmedNote = useMemo(() => note.trim(), [note]);

  const topicsCleaned = useMemo(() => {
    return selectedTopics.map((t) => t.trim()).filter(Boolean);
  }, [selectedTopics]);

  const validate = () => {
    if (!mood) return "Select a mood";
    if (!energy) return "Select an energy level";
    if (topicsCleaned.length > MAX_TOPICS) return `Select up to ${MAX_TOPICS} topics`;
    if (trimmedNote.length > NOTE_MAX) return `Note is too long (max ${NOTE_MAX})`;
    return "";
  };

  return {
    // constants
    NOTE_MAX,
    MAX_TOPICS,

    // state
    mood,
    energy,
    selectedTopics,
    topicCustom,
    note,

    // derived
    trimmedNote,
    topicsCleaned,

    // setters
    setMood,
    setEnergy,
    setSelectedTopics,
    setTopicCustom,
    setNote,

    validate,
  };
}
