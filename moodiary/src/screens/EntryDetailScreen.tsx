// /workspaces/maw/moodiary/src/screens/EntryDetailScreen.tsx

import React, { useMemo } from "react";
import { ScrollView, View, Alert } from "react-native";
import dayjs from "dayjs";
import { useLocalSearchParams, router } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Divider,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../providers/AuthProvider";
import { useEntrySession } from "../query/useEntrySession";
import { deleteSessionById } from "../firebase/diaryRepo";
import { EntryId, EntrySlot, ISODate, parseEntryId } from "../core/types";

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function cleanTopics(input: unknown): string[] {
  if (Array.isArray(input)) {
    const cleaned = input
      .map((t) => String(t ?? "").trim())
      .filter(Boolean);
    return Array.from(new Set(cleaned));
  }
  return [];
}

export default function EntryDetailScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const params = useLocalSearchParams();

  // ✅ entryId 파라미터
  const entryIdRaw = useMemo(() => safeString(params.entryId), [params.entryId]);

  // ✅ core/types의 파서로 통일
  const parsed = useMemo(() => parseEntryId(entryIdRaw), [entryIdRaw]);

  const date = parsed.date as ISODate | null;
  const slot = parsed.slot as EntrySlot | null;

  // ✅ 유효한 entryId만 훅에 전달
  const entryId: EntryId | null = useMemo(() => {
    return date && slot ? (entryIdRaw as EntryId) : null;
  }, [entryIdRaw, date, slot]);

  const { data: session, isLoading, isError } = useEntrySession(
    user?.uid ?? null,
    entryId
  );

  const title = useMemo(() => {
    if (!date || !slot) return "기록 상세";
    const slotLabel = slot === "morning" ? "오전" : "오후";
    return `${dayjs(date).format("YYYY.MM.DD")} · ${slotLabel}`;
  }, [date, slot]);

  // ✅ 멀티 토픽 표시용 (topics 우선, 없으면 topic 승격)
  const topics = useMemo(() => {
    const fromTopics = cleanTopics((session as any)?.topics);
    if (fromTopics.length > 0) return fromTopics;

    const legacy = typeof (session as any)?.topic === "string" ? (session as any).topic.trim() : "";
    return legacy ? [legacy] : [];
  }, [session]);

  const onEdit = () => {
    if (!date || !slot) return;
    router.push({
      pathname: "/entry",
      params: { date, slot },
    });
  };

  const onDelete = () => {
    if (!user?.uid || !entryId || !date) return;

    Alert.alert("기록 삭제", "이 기록을 삭제할까? (복구 불가)", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deleteSessionById(user.uid, entryId);

          qc.invalidateQueries({ queryKey: ["entrySession", user.uid, entryId] });
          qc.invalidateQueries({ queryKey: ["todaySessions", user.uid, date] });
          qc.invalidateQueries({ queryKey: ["monthSessions", user.uid] });
          qc.invalidateQueries({ queryKey: ["reportSessions", user.uid] });

          router.replace({
            pathname: "/calendar",
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
              {/* ✅ 핵심: topics 전체 표시 */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Chip icon="flash">energy: {session.energy}</Chip>
                <Chip icon="emoticon-outline">mood: {session.mood}</Chip>
              </View>

              <Divider />

              <View style={{ gap: 6 }}>
                <Text variant="titleMedium">토픽</Text>

                {topics.length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {topics.map((t) => (
                      <Chip key={t} icon="tag-outline">
                        {t}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <Text style={{ opacity: 0.7 }}>—</Text>
                )}
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
