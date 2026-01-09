// /workspaces/maw/moodiary/src/screens/home/HomeScreen.tsx
import React from "react";
import { ScrollView } from "react-native";

import { useHomeState } from "./useHomeState";

// sections
import HeaderSection from "./sections/HeaderSection";
import WeekSection from "./sections/WeekSection";
import SummarySection from "./sections/SummarySection";
import TodayCards from "./sections/TodayCards";
import InsightSection from "./sections/InsightSection";

export default function HomeScreen() {
  const h = useHomeState();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <HeaderSection
        nickname={h.nickname}
        onPressProfile={h.goProfile}
        onPressBell={() => {}}
      />

      <WeekSection
        selectedDate={h.selectedDate}
        setSelectedDate={h.setSelectedDate}
        week={h.week}
        hasMorning={!!h.morning}
        hasEvening={!!h.evening}
      />

      <SummarySection
        morning={h.morning ? { energy: h.morning.energy, mood: String(h.morning.mood) } : null}
        evening={h.evening ? { energy: h.evening.energy, mood: String(h.evening.mood) } : null}
        energyMode={h.energyMode}
        setEnergyMode={h.setEnergyMode}
      />

      <TodayCards
        selectedDate={h.selectedDate}
        todayId={h.todayId}
        isLoading={h.isLoading}
        status={h.status}
        morning={h.morning ? { mood: String(h.morning.mood), energy: h.morning.energy, note: h.morning.note } : null}
        evening={h.evening ? { mood: String(h.evening.mood), energy: h.evening.energy, note: h.evening.note } : null}
        morningTopics={h.morningTopics}
        eveningTopics={h.eveningTopics}
        goEntry={h.goEntry}
        goDetail={h.goDetail}
        onPressTopic={h.openTopicInCalendar}
      />

      <InsightSection
        insight={h.insight}
        hasMorning={!!h.morning}
        hasEvening={!!h.evening}
        goEntry={h.goEntry}
      />
    </ScrollView>
  );
}
