import React from "react";
import { View } from "react-native";
import { Card, Text, Divider, Button } from "react-native-paper";
import type { CoachResult, CoachCTA } from "../../../core/coachEngine";

type Props = {
  coach: CoachResult | null;
  onPressCta?: (cta: CoachCTA) => void;
};

export default function CoachCard({ coach, onPressCta }: Props) {
  if (!coach) return null;

  const primary = coach.ctas.find((c) => c.intent === "primary");
  const secondary = coach.ctas.find((c) => c.intent === "secondary");

  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium">코치</Text>

        <Divider />

        <View style={{ gap: 6 }}>
          <Text variant="titleMedium">{coach.title}</Text>
          <Text style={{ opacity: 0.82 }}>{coach.message}</Text>
        </View>

        {coach.evidence?.length ? (
          <>
            <Divider />
            <View style={{ gap: 4 }}>
              <Text style={{ opacity: 0.7 }}>근거</Text>
              {coach.evidence.slice(0, 3).map((e, idx) => (
                <Text key={`${e}-${idx}`} style={{ opacity: 0.75 }}>
                  • {e}
                </Text>
              ))}
            </View>
          </>
        ) : null}

        <Divider />

        <View style={{ gap: 8 }}>
          {primary ? (
            <Button mode="contained" onPress={() => onPressCta?.(primary)}>
              {primary.title}
            </Button>
          ) : null}

          {secondary ? (
            <Button mode="outlined" onPress={() => onPressCta?.(secondary)}>
              {secondary.title}
            </Button>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}
