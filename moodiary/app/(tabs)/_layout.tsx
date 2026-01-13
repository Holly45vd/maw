import React from "react";
import { View, Pressable } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { orbit } from "../../src/ui/theme";

function iconFor(routeName: string) {
  switch (routeName) {
    case "index":
      return "home-variant-outline";
    case "calendar":
      return "calendar-month-outline";
    case "report":
      return "chart-box-outline";
    case "profile":
      return "account-outline";
    default:
      return "circle-outline";
  }
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // ✅ 우리 테마
  const BAR_BG = orbit.colors.primary; // 바 배경
  const PILL_BG = orbit.colors.card; // 선택 pill 배경(흰색)
  const ACTIVE_ICON = orbit.colors.primary; // 선택 아이콘(우리색)
  const INACTIVE_ICON = "rgba(255,255,255,0.82)"; // 비선택 아이콘(흰색)

  // ✅ 탭바에서 숨길 라우트 (등록/디테일)
  const HIDDEN = new Set(["entry", "entry-detail"]);

  const focusedRouteName = state.routes[state.index]?.name;
  const visibleRoutes = state.routes.filter((r) => !HIDDEN.has(r.name));

  return (
    <View
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: orbit.spacing.screen,
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          backgroundColor: BAR_BG,
          borderRadius: 22,
          paddingHorizontal: 10,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = focusedRouteName === route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          const icon = iconFor(route.name);

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1, alignItems: "center" }}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
            >
              {/* 선택된 탭만 흰색 pill */}
              <View
                style={{
                  paddingHorizontal: focused ? 18 : 0,
                  paddingVertical: 10,
                  borderRadius: 18,
                  backgroundColor: focused ? PILL_BG : "transparent",
                  minWidth: focused ? 60 : 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={22}
                  color={focused ? ACTIVE_ICON : INACTIVE_ICON}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* ✅ 숨김은 href:null만 사용 (tabBarButton 금지) */}
      <Tabs.Screen name="entry" options={{ href: null }} />
      <Tabs.Screen name="entry-detail" options={{ href: null }} />
    </Tabs>
  );
}
