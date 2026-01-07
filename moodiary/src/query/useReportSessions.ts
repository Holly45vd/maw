import { useQuery } from "@tanstack/react-query";
import { listSessionsByRange } from "../firebase/diaryRepo";
import { EntrySession } from "../core/types";

export function useReportSessions(
  uid: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery<EntrySession[]>({
    queryKey: ["reportSessions", uid, startDate, endDate],
    enabled: !!uid && !!startDate && !!endDate,
    queryFn: async () => {
      if (!uid) return [];
      return listSessionsByRange(uid, startDate, endDate);
    },
    staleTime: 1000 * 30, // 30s
  });
}
