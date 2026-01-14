// src/screens/entry/components/TopicSection.tsx
import React from "react";
import { View } from "react-native";
import { Card, Chip, Divider, IconButton, Text, TextInput, useTheme } from "react-native-paper";

export default function TopicSection({
  presets,
  selectedTopics,
  maxTopics,
  topicsCleaned,
  topicCustom,
  onChangeTopicCustom,
  onToggleTopic,
  onAddCustomTopic,
}: {
  presets: string[];
  selectedTopics: string[];
  maxTopics: number;
  topicsCleaned: string[];
  topicCustom: string;
  onChangeTopicCustom: (v: string) => void;
  onToggleTopic: (t: string) => void;
  onAddCustomTopic: () => void;
}) {
  const { colors } = useTheme();
  const bg = colors.background;
  const surface = colors.surface;
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";
  const onSurface = colors.onSurface;
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.6)";
  const primary = colors.primary;
  const onPrimary = colors.onPrimary ?? "#fff";

  return (
    <Card style={{ borderRadius: 16, backgroundColor: surface }}>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium" style={{ color: onSurface }}>
          토픽 (다중 선택 · 최대 {maxTopics}개)
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {presets.map((t) => {
            const selected = selectedTopics.includes(t);
            return (
              <Chip
                key={t}
                selected={selected}
                onPress={() => onToggleTopic(t)}
                style={{
                  backgroundColor: selected ? primary : surface,
                  borderWidth: 1,
                  borderColor: outline,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: selected ? onPrimary : onSurface, fontWeight: selected ? "800" : "600" }}>
                  {t}
                </Text>
              </Chip>
            );
          })}
        </View>

        <Divider style={{ backgroundColor: outline }} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              mode="outlined"
              value={topicCustom}
              onChangeText={onChangeTopicCustom}
              placeholder="새 토픽 추가 (예: 이직, 병원, 이사...)"
              onSubmitEditing={onAddCustomTopic}
              returnKeyType="done"
              outlineColor={outline}
              activeOutlineColor={primary}
              style={{ backgroundColor: bg }}
            />
          </View>

          <IconButton icon="plus" onPress={onAddCustomTopic} iconColor={primary} />
        </View>


      </Card.Content>
    </Card>
  );
}
