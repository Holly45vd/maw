import React, { PropsWithChildren, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./queryClient";
import { AuthProvider } from "./AuthProvider";
import { orbit } from "../ui/theme";

export default function AppProviders({ children }: PropsWithChildren) {
  const theme = useMemo(() => {
    return {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: orbit.colors.primary,
        secondary: orbit.colors.accent,
        background: orbit.colors.bg,
        surface: orbit.colors.card,
        onSurface: orbit.colors.text,
        onSurfaceVariant: orbit.colors.subtext,
        outline: orbit.colors.line,
        error: orbit.colors.danger,
      },
      roundness: orbit.radius.soft,
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme as any}>
          <AuthProvider>{children}</AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
