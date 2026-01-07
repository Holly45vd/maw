import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getSession } from "../firebase/diaryRepo";
import { EntrySession } from "../core/types";

export function useTodaySessions(uid: string | null, date?: string) {
  const d = date ?? dayjs().format("YYYY-MM-DD");

  return useQuery<{ morning: EntrySession | null; evening: EntrySession | null }>({
    queryKey: ["todaySessions", uid, d],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return { morning: null, evening: null };
      const [morning, evening] = await Promise.all([
        getSession(uid, d, "morning"),
        getSession(uid, d, "evening"),
      ]);
      return { morning, evening };
    },
    staleTime: 1000 * 10,
  });
}
