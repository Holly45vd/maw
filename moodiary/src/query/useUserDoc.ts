import { useQuery } from "@tanstack/react-query";
import { getUserDoc } from "../firebase/userRepo";
import { UserDoc } from "../firebase/userRepo";

export function useUserDoc(uid: string | null) {
  return useQuery<UserDoc | null>({
    queryKey: ["userDoc", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      return getUserDoc(uid);
    },
    staleTime: 1000 * 20,
  });
}
