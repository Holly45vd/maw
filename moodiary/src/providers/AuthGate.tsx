import React, { PropsWithChildren, useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "./AuthProvider";

export default function AuthGate({ children }: PropsWithChildren) {
  const { user, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;

    // 로그인 안 됨 → /auth/login
    if (!user) router.replace("/auth/login");
    // 로그인 됨 → 탭 홈으로
    else router.replace("/(tabs)");
  }, [user, initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
