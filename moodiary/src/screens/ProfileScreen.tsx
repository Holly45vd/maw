import React, { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { Button, Card, Divider, Switch, Text, TextInput, SegmentedButtons, Snackbar } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "firebase/auth";

import { useAuth } from "../providers/AuthProvider";
import { auth } from "../firebase/firebase";
import { useUserDoc } from "../query/useUserDoc";
import { updateUserProfile, updateUserSettings } from "../firebase/userRepo";

type DefaultTab = "home" | "calendar" | "report" | "profile";

export default function ProfileScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: userDoc, isLoading } = useUserDoc(user?.uid ?? null);

  const [displayName, setDisplayName] = useState<string>("");
  const [savingName, setSavingName] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" });

  // userDoc 로드 후 초기값 세팅 (한 번만)
  React.useEffect(() => {
    if (!userDoc) return;
    setDisplayName(userDoc.displayName ?? user?.displayName ?? "");
  }, [userDoc, user?.displayName]);

  const showQuote = userDoc?.settings?.showQuote ?? true;
  const reminderEnabled = userDoc?.settings?.reminderEnabled ?? false;
  const defaultTab = (userDoc?.settings?.defaultTab ?? "home") as DefaultTab;

  const canSaveName = !!user?.uid && displayName.trim().length >= 2;

  const onSaveName = async () => {
    if (!user?.uid) return;
    const name = displayName.trim();
    if (name.length < 2) return;

    setSavingName(true);
    try {
      // 1) Firestore
      await updateUserProfile(user.uid, { displayName: name });
      // 2) Firebase Auth 프로필도 같이
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
      setToast({ visible: true, msg: "닉네임이 저장됐어" });
    } finally {
      setSavingName(false);
    }
  };

  const onToggleQuote = async (v: boolean) => {
    if (!user?.uid) return;
    await updateUserSettings(user.uid, { showQuote: v });
    qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
  };

  const onToggleReminder = async (v: boolean) => {
    if (!user?.uid) return;
    await updateUserSettings(user.uid, { reminderEnabled: v });
    qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
  };

  const onChangeDefaultTab = async (v: string) => {
    if (!user?.uid) return;
    await updateUserSettings(user.uid, { defaultTab: v as DefaultTab });
    qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
  };

  const onLogout = async () => {
    await auth.signOut();
  };

  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Card>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">로그인이 필요해</Text>
            <Text style={{ opacity: 0.7 }}>프로필/설정은 로그인 후 사용할 수 있다.</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineMedium">Profile</Text>
        <Text style={{ opacity: 0.7 }}>{user.email ?? ""}</Text>
      </View>

      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">닉네임</Text>
          <TextInput
            mode="outlined"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="2글자 이상"
          />
          <Button mode="contained" loading={savingName} disabled={!canSaveName || savingName} onPress={onSaveName}>
            저장
          </Button>
          <Text style={{ opacity: 0.6, fontSize: 12 }}>
            홈/리포트에서 표시될 이름. (나중에 친구 공유 기능 붙여도 그대로 씀)
          </Text>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">설정</Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text>명언(Quote) 표시</Text>
            <Switch value={showQuote} onValueChange={onToggleQuote} />
          </View>

          <Divider />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text>리마인더 (Phase 2)</Text>
            <Switch value={reminderEnabled} onValueChange={onToggleReminder} />
          </View>

          <Divider />

          <Text style={{ opacity: 0.7 }}>기본 탭</Text>
          <SegmentedButtons
            value={defaultTab}
            onValueChange={onChangeDefaultTab}
            buttons={[
              { value: "home", label: "홈" },
              { value: "calendar", label: "캘린더" },
              { value: "report", label: "리포트" },
              { value: "profile", label: "프로필" },
            ]}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">계정</Text>
          <Button mode="outlined" onPress={onLogout}>
            로그아웃
          </Button>
        </Card.Content>
      </Card>

      <Snackbar
        visible={toast.visible}
        onDismiss={() => setToast({ visible: false, msg: "" })}
        duration={900}
      >
        {toast.msg}
      </Snackbar>
    </ScrollView>
  );
}
