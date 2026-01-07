import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../firebase/firebase";
import { EntrySession } from "../core/types";

export function useMonthSessions(
  uid: string | null,
  month: string // YYYY-MM
) {
  return useQuery({
    queryKey: ["monthSessions", uid, month],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];

      const start = `${month}-01`;
      const end = dayjs(start).endOf("month").format("YYYY-MM-DD");

      const q = query(
        collection(db, "users", uid, "entries"),
        where("date", ">=", start),
        where("date", "<=", end)
      );

      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as EntrySession);
    },
  });
}
