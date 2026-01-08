// /workspaces/maw/moodiary/src/screens/EntryDetailScreen.tsx

import React, { useMemo } from "react";
import { ScrollView, View, Alert } from "react-native";
import dayjs from "dayjs";
import { useLocalSearchParams, router } from "expo-router";
import { Button, Card, Chip, Divider, Text, ActivityIndicator } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../providers/AuthProvider";
import { useEntrySession } from "../query/useEntrySession";
import { deleteSessionById } from "../firebase/diaryRepo";
import type { EntrySlot } from "../core/types";

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function parseEntryId(entryId: string): { date: string; slot: EntrySlot | null } {
  // entryId = YYYY-MM-DD_slot
  const [date, slot] = entryId.split("_");
  const s = slot === "morning" || slot === "evening" ? (slot as EntrySlot) : null;
  return { date: date ?? "", slot: s };
}

export default function EntryDetailScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const params = useLocalSearchParams();
  const entryId = useMemo(() => safeString(params.entryId), [params.entryId]);

  const { date, slot } = useMemo(() => parseEntryId(entryId), [entryId]);

  const { data: session, isLoading, isError } = useEntrySession(user?.uid ?? null, entryId || null);

  const title = useMemo(() => {
    if (!date || !slot) return "기록 상세";
    const slotLabel = slot === "morning" ? "오전" : "오후";
    return `${dayjs(date).format("YYYY.MM.DD")} · ${slotLabel}`;
  }, [date, slot]);

  const onEdit = () => {
    if (!date || !slot) return;
    router.push({
      pathname: "/(tabs)/entry",
      params: { date, slot },
    });
  };

  const onDelete = () => {
    if (!user?.uid || !entryId) return;

    Alert.alert("기록 삭제", "이 기록을 삭제할까? (복구 불가)", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deleteSessionById(user.uid, entryId);

          // ✅ 관련 캐시 무효화 (홈/캘린더/리포트 전부 영향)
          if (date) {
            qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
            qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
          }
          // month 값은 파라미터로 모르는 경우가 많으니 prefix로 쏴버림(간단/안전)
          qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
          qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

          // ✅ 보통 삭제 후엔 캘린더로
          router.replace({
            pathname: "/(tabs)/calendar",
            params: { date },
          });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ opacity: 0.65 }}>Entry Detail</Text>
        <Text variant="headlineSmall">{title}</Text>
      </View>

      {isLoading ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.7 }}>불러오는 중...</Text>
          </Card.Content>
        </Card>
      ) : isError ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">에러</Text>
            <Text style={{ opacity: 0.7 }}>기록을 불러오지 못했어.</Text>
            <Button mode="contained" onPress={() => router.back()}>
              뒤로
            </Button>
          </Card.Content>
        </Card>
      ) : !session ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">기록 없음</Text>
            <Text style={{ opacity: 0.7 }}>
              해당 기록이 존재하지 않아. 삭제됐거나 entryId가 잘못됐을 수 있어.
            </Text>
            <Button mode="contained" onPress={() => router.back()}>
              뒤로
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Card>
            <Card.Content style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Chip icon="flash">energy: {session.energy}</Chip>
                <Chip icon="emoticon-outline">mood: {session.mood}</Chip>
                <Chip icon="tag-outline">topic: {session.topic || "—"}</Chip>
              </View>

              <Divider />

              <View style={{ gap: 6 }}>
                <Text variant="titleMedium">노트</Text>
                <Text style={{ opacity: 0.8 }}>
                  {session.note && session.note.trim().length > 0 ? session.note : "—"}
                </Text>
              </View>

              <Divider />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ opacity: 0.6 }}>
                  created:{" "}
                  {session.createdAt?.toDate
                    ? dayjs(session.createdAt.toDate()).format("YYYY.MM.DD HH:mm")
                    : "—"}
                </Text>
                <Text style={{ opacity: 0.6 }}>
                  updated:{" "}
                  {session.updatedAt?.toDate
                    ? dayjs(session.updatedAt.toDate()).format("YYYY.MM.DD HH:mm")
                    : "—"}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button mode="contained" style={{ flex: 1 }} onPress={onEdit}>
              수정하기
            </Button>
            <Button mode="outlined" style={{ flex: 1 }} onPress={onDelete}>
              삭제하기
            </Button>
          </View>

          <Button mode="text" onPress={() => router.back()}>
            뒤로가기
          </Button>
        </>
      )}
    </ScrollView>
  );
}
