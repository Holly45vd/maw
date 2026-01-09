import React from "react";
import { View } from "react-native";
import { IconButton, Searchbar, Text } from "react-native-paper";

type Props = {
  nickname: string;
  onPressProfile: () => void;
  onPressBell?: () => void;
};

export default function HeaderSection({
  nickname,
  onPressProfile,
  onPressBell,
}: Props) {
  const initial = (nickname?.trim() || "나").slice(0, 1).toUpperCase();

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(30,136,229,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "800", color: "#1E88E5" }}>
              {initial}
            </Text>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={{ opacity: 0.7 }}>Good day 👋</Text>
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              {nickname}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          <IconButton icon="cog-outline" onPress={onPressProfile} />
          <IconButton icon="bell-outline" onPress={onPressBell ?? (() => {})} />
        </View>
      </View>

      <Searchbar
        placeholder="Search..."
        value={""}
        onChangeText={() => {}}
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}
