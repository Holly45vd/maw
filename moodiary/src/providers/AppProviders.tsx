import React, { PropsWithChildren, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./queryClient";
import { AuthProvider } from "./AuthProvider";

export default function AppProviders({ children }: PropsWithChildren) {
  const theme = useMemo(() => ({}), []);

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
