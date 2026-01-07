import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* ✅ 탭바는 유지하되, 탭 버튼에서 숨김 */}
      <Tabs.Screen
        name="entry"
        options={{
          href: null, // 탭바에서 제거
        }}
      />
      <Tabs.Screen
        name="entry-detail"
        options={{
          href: null, // 탭바에서 제거
        }}
      />
    </Tabs>
  );
}
