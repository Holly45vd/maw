// src/screens/entry/components/NoteSection.tsx
import React from "react";
import { Card, Text, TextInput, useTheme } from "react-native-paper";

export default function NoteSection({
  note,
  onChange,
  noteMax,
  trimmedLength,
}: {
  note: string;
  onChange: (v: string) => void;
  noteMax: number;
  trimmedLength: number;
}) {
  const { colors } = useTheme();
  const bg = colors.background;
  const surface = colors.surface;
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";
  const onSurface = colors.onSurface;
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.6)";
  const primary = colors.primary;

  return (
    <Card style={{ borderRadius: 16, backgroundColor: surface }}>
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium" style={{ color: onSurface }}>
          메모
        </Text>

        <TextInput
          mode="outlined"
          value={note}
          onChangeText={onChange}
          placeholder="한 줄 메모"
          multiline
          outlineColor={outline}
          activeOutlineColor={primary}
          style={{ backgroundColor: bg }}
        />

        <Text style={{ color: muted, alignSelf: "flex-end" }}>
          {trimmedLength}/{noteMax}
        </Text>
      </Card.Content>
    </Card>
  );
}
