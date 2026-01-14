// src/screens/entry/components/TopicSection.tsx
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Card, Chip, Divider, IconButton, Text, TextInput, useTheme } from "react-native-paper";

type Props = {
  presets: string[];
  selectedTopics: string[];
  maxTopics: number;
  topicsCleaned: string[];

  topicCustom: string;
  onChangeTopicCustom: (v: string) => void;

  onToggleTopic: (t: string) => void;
  onAddCustomTopic: () => void;

  // ✅ 실제 프리셋 삭제 (DB 반영)
  onRemoveTopicPreset?: (t: string) => void;

  // ✅ 기본 프리셋이면 X 숨김
  basePresets?: readonly string[];
};

export default function TopicSection({
  presets,
  selectedTopics,
  maxTopics,
  topicsCleaned,
  topicCustom,
  onChangeTopicCustom,
  onToggleTopic,
  onAddCustomTopic,
  onRemoveTopicPreset,
  basePresets = [],
}: Props) {
  const { colors } = useTheme();
  const bg = colors.background;
  const surface = colors.surface;
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";
  const onSurface = colors.onSurface;
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.6)";
  const primary = colors.primary;
  const onPrimary = colors.onPrimary ?? "#fff";

  const [adding, setAdding] = useState(false);
  const baseSet = useMemo(() => new Set(basePresets as readonly string[]), [basePresets]);

  const canShowX = (t: string) => {
    if (!onRemoveTopicPreset) return false;
    if (baseSet.has(t)) return false; // base preset은 삭제 금지
    return true; // 커스텀 프리셋은 삭제 가능
  };

  const submitInline = () => {
    onAddCustomTopic();
    setAdding(false);
  };

  return (
    <Card style={{ borderRadius: 16, backgroundColor: surface }}>
      <Card.Content style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Text variant="titleMedium" style={{ color: onSurface }}>
            Topics
          </Text>
          <Text style={{ color: muted, fontWeight: "700" }}>
            {topicsCleaned.length}/{maxTopics}
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {presets.map((t) => {
            const selected = selectedTopics.includes(t);
            const showX = canShowX(t);

            return (
              <Chip
                key={t}
                selected={selected}
                onPress={() => onToggleTopic(t)}
                // ✅ 작은 X (Paper Chip 표준)
                onClose={showX ? () => onRemoveTopicPreset?.(t) : undefined}
                closeIcon={showX ? "close" : undefined}
                style={{
                  backgroundColor: selected ? primary : surface,
                  borderWidth: 1,
                  borderColor: outline,
                  paddingVertical: 6,
                }}
                textStyle={{
                  color: selected ? onPrimary : onSurface,
                  fontWeight: selected ? "800" : "600",
                }}
              >
                {t}
              </Chip>
            );
          })}

          {!adding ? (
            <Chip
              icon="plus"
              onPress={() => setAdding(true)}
              style={{
                backgroundColor: surface,
                borderWidth: 1,
                borderColor: outline,
                paddingVertical: 6,
              }}
              textStyle={{ color: muted, fontWeight: "800" }}
            >
              Add topic
            </Chip>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: outline,
                borderRadius: 999,
                backgroundColor: bg,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <TextInput
                value={topicCustom}
                onChangeText={onChangeTopicCustom}
                placeholder="Type…"
                placeholderTextColor={muted}
                onSubmitEditing={submitInline}
                returnKeyType="done"
                dense
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                style={{ backgroundColor: "transparent", height: 32, minWidth: 120 }}
                contentStyle={{ paddingTop: 6, paddingBottom: 6 }}
              />

              <IconButton icon="check" size={18} onPress={submitInline} iconColor={primary} style={{ margin: 0 }} />
              <IconButton
                icon="close"
                size={18}
                onPress={() => {
                  setAdding(false);
                  onChangeTopicCustom("");
                }}
                iconColor={muted}
                style={{ margin: 0 }}
              />
            </View>
          )}
        </View>

        <Divider style={{ backgroundColor: outline }} />
        <Text style={{ color: muted, fontSize: 12 }}>
          Tap to select/deselect. Use ✕ to remove a custom preset.
        </Text>
      </Card.Content>
    </Card>
  );
}
