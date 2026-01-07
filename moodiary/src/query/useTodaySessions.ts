import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getSession } from "../firebase/diaryRepo";
import { EntrySession } from "../core/types";

type Result = {
  morning: EntrySession | null;
  evening: EntrySession | null;
};

export function useTodaySessions(uid: string | null) {
  const today = dayjs().format("YYYY-MM-DD");

  return useQuery<Result>({
    queryKey: ["todaySessions", uid, today],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return { morning: null, evening: null };
      const [morning, evening] = await Promise.all([
        getSession(uid, today, "morning"),
        getSession(uid, today, "evening"),
      ]);
      return { morning, evening };
    },
  });
}
