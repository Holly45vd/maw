// src/screens/calendar/components/SlotCard.tsx
import React from "react";
import { View } from "react-native";
import { Card, Text, Chip, Button } from "react-native-paper";
import type { EntrySession, EntrySlot } from "../../../core/types";

export default function SlotCard({
  title,
  date,
  slot,
  session,
  isFuture,
  focusTopic,
  getTopics,
  onPressSlot,
}: {
  title: string;
  date: string;
  slot: EntrySlot;
  session?: EntrySession;
  isFuture: boolean;
  focusTopic: string;
  getTopics: (s: any) => string[];
  onPressSlot: (date: string, slot: EntrySlot, has: boolean) => void;
}) {
  const has = !!session;

  const topics = has ? getTopics(session as any) : [];
  const topicHit = focusTopic ? topics.includes(focusTopic) : true;

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="titleMedium">{title}</Text>
          <Chip>{has ? "기록됨" : "미기록"}</Chip>
        </View>

        {isFuture ? (
          <Text style={{ opacity: 0.6 }}>미래 날짜는 기록할 수 없어.</Text>
        ) : !has ? (
          <Text style={{ opacity: 0.7 }}>아직 기록이 없어. {title}을 남겨보자.</Text>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {"energy" in (session as any) ? (
                <Chip>에너지: {(session as any).energy}</Chip>
              ) : null}
              {"mood" in (session as any) ? (
                <Chip>무드: {(session as any).mood}</Chip>
              ) : null}

              {topics.length > 0 ? <Chip>토픽: {topics.join(", ")}</Chip> : <Chip>토픽: —</Chip>}
            </View>

            {focusTopic ? (
              <Text style={{ opacity: 0.65 }}>
                focus: <Text style={{ fontWeight: "600" }}>{focusTopic}</Text>{" "}
                {topicHit ? "(포함)" : "(이 기록엔 없음)"}
              </Text>
            ) : null}
          </>
        )}

        <Button
          mode={has ? "outlined" : "contained"}
          disabled={isFuture}
          onPress={() => onPressSlot(date, slot, has)}
        >
          {isFuture ? "기록 불가" : has ? "자세히 보기" : "기록하기"}
        </Button>
      </Card.Content>
    </Card>
  );
}
