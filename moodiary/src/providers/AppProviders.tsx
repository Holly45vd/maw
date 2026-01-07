import React, { PropsWithChildren, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

export default function AppProviders({ children }: PropsWithChildren) {
  // 나중에 테마 커스터마이징 필요하면 여기서 theme 만들어 넣으면 됨
  const theme = useMemo(() => ({}), []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme as any}>{children}</PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
