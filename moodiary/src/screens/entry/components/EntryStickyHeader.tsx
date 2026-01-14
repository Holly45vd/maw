// src/screens/entry/components/EntryStickyHeader.tsx
import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Menu, Text, TouchableRipple, useTheme } from "react-native-paper";

type SlotKey = "morning" | "evening";

type Props = {
  dateText: string;

  slot: SlotKey;
  SlotIcon: React.ComponentType<any>;

  MorningIcon: React.ComponentType<any>;
  EveningIcon: React.ComponentType<any>;

  saving: boolean;
  onSave: () => void;

  onChangeSlot: (slot: SlotKey) => void;
  onPressDate?: () => void;
};

export default function EntryStickyHeader({
  dateText,
  slot,
  SlotIcon,
  MorningIcon,
  EveningIcon,
  saving,
  onSave,
  onChangeSlot,
  onPressDate,
}: Props) {
  const { colors } = useTheme();

  const bg = colors.background;
  const surface = colors.surface;
  const outline = colors.outline ?? "rgba(0,0,0,0.12)";
  const onSurface = colors.onSurface;
  const muted = colors.onSurfaceVariant ?? "rgba(0,0,0,0.55)";
  const primary = colors.primary;

  const [menuOpen, setMenuOpen] = useState(false);

  const slotLabel = useMemo(() => (slot === "morning" ? "Morning" : "Evening"), [slot]);
  const slotSubLabel = useMemo(() => (slot === "morning" ? "" : ""), [slot]);

  const pick = (next: SlotKey) => {
    setMenuOpen(false);
    if (next === slot) return;
    onChangeSlot(next);
  };

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: outline,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Slot dropdown (icon anchor) */}
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={
              <Pressable
                onPress={() => setMenuOpen(true)}
                hitSlop={10}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 18,
                  backgroundColor: surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SlotIcon width={90} height={90} />

                {/* tiny dropdown chevron */}
                <View
                  style={{
                    position: "absolute",
                    right: 7,
                    bottom: 6,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: bg,
                    borderWidth: 1,
                    borderColor: outline,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 10, color: muted, lineHeight: 12 }}>▾</Text>
                </View>
              </Pressable>
            }
          >
            <Menu.Item
              onPress={() => pick("morning")}
              title="Morning"
              leadingIcon={() => <MorningIcon width={20} height={20} />}
              trailingIcon={slot === "morning" ? "check" : undefined}
            />
            <Menu.Item
              onPress={() => pick("evening")}
              title="Evening"
              leadingIcon={() => <EveningIcon width={20} height={20} />}
              trailingIcon={slot === "evening" ? "check" : undefined}
            />
          </Menu>

          {/* Date + slot info */}
          <View style={{ gap: 4 }}>
            {onPressDate ? (
              <TouchableRipple
                onPress={onPressDate}
                borderless={false}
                style={{ alignSelf: "flex-start", borderRadius: 8 }}
              >
                <Text
                  style={{
                    color: onSurface,
                    fontWeight: "900",
                    fontSize: 16,
                    paddingVertical: 2,
                    paddingHorizontal: 2,
                  }}
                >
                  {dateText}
                </Text>
              </TouchableRipple>
            ) : (
              <Text style={{ color: onSurface, fontWeight: "900", fontSize: 16 }}>{dateText}</Text>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: onSurface, fontSize: 13, fontWeight: "800" }}>{slotLabel}</Text>
              <Text style={{ color: muted, fontSize: 13 }}>{slotSubLabel}</Text>
            </View>
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          textColor={primary}
          style={{ borderColor: outline, borderWidth: 1, borderRadius: 12 }}
          contentStyle={{ paddingVertical: 6, paddingHorizontal: 10 }}
          labelStyle={{ fontWeight: "900" }}
        >
          Save
        </Button>
      </View>
    </View>
  );
}
