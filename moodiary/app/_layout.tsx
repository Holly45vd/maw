import React from "react";
import { Stack } from "expo-router";
import AppProviders from "../src/providers/AppProviders";
import AuthGate from "../src/providers/AuthGate";

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </AppProviders>
  );
}
