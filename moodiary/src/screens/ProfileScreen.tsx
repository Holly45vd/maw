import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text variant="headlineMedium">Profile</Text>
      <Text style={{ marginTop: 8, opacity: 0.7 }}>Coming soon</Text>
    </View>
  );
}
