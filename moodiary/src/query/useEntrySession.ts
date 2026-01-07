import { useQuery } from "@tanstack/react-query";
import { getSessionById } from "../firebase/diaryRepo";

export function useEntrySession(uid: string | null, entryId: string | null) {
  return useQuery({
    queryKey: ["entrySession", uid, entryId],
    enabled: !!uid && !!entryId,
    queryFn: async () => {
      if (!uid || !entryId) return null;
      return getSessionById(uid, entryId);
    },
  });
}
