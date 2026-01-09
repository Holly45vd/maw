import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import {
  Button,
  Card,
  Divider,
  Switch,
  Text,
  TextInput,
  SegmentedButtons,
  Snackbar,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "firebase/auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { useAuth } from "../providers/AuthProvider";
import { auth } from "../firebase/firebase";
import { useUserDoc } from "../query/useUserDoc";
import { updateUserProfile, updateUserSettings } from "../firebase/userRepo";

type DefaultTab = "home" | "calendar" | "report" | "profile";
type ToastState = { visible: boolean; msg: string };

export default function ProfileScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: userDoc, isLoading } = useUserDoc(user?.uid ?? null);

  // Toast
  const [toast, setToast] = useState<ToastState>({ visible: false, msg: "" });
  const showToast = (msg: string) => setToast({ visible: true, msg });

  // ----------------------------
  // Nickname (edit mode)
  // ----------------------------
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [savingName, setSavingName] = useState(false);

  const originalName = useMemo(() => {
    return (userDoc?.displayName ?? user?.displayName ?? "").trim();
  }, [userDoc?.displayName, user?.displayName]);

  // ----------------------------
  // Settings local mirror
  // ----------------------------
  const [showQuoteLocal, setShowQuoteLocal] = useState(true);
  const [reminderEnabledLocal, setReminderEnabledLocal] = useState(false);
  const [defaultTabLocal, setDefaultTabLocal] = useState<DefaultTab>("home");

  const [savingQuote, setSavingQuote] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingDefaultTab, setSavingDefaultTab] = useState(false);

  // ----------------------------
  // Password change (inline)
  // ----------------------------
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwVisible1, setPwVisible1] = useState(false);
  const [pwVisible2, setPwVisible2] = useState(false);
  const [pwVisible3, setPwVisible3] = useState(false);

  const email = user?.email ?? "";

  const anySaving =
    savingName || savingQuote || savingReminder || savingDefaultTab || savingPw;

  // Init from userDoc
  useEffect(() => {
    if (!userDoc) return;

    setDisplayName(userDoc.displayName ?? user?.displayName ?? "");

    const s = userDoc.settings ?? {};
    setShowQuoteLocal(s.showQuote ?? true);
    setReminderEnabledLocal(s.reminderEnabled ?? false);
    setDefaultTabLocal((s.defaultTab ?? "home") as DefaultTab);
  }, [userDoc, user?.displayName]);

  // ----------------------------
  // Nickname handlers
  // ----------------------------
  const nameTrimmed = displayName.trim();
  const nameChanged = nameTrimmed !== originalName;
  const canSaveName = !!user?.uid && nameTrimmed.length >= 2 && nameChanged;

  const onSaveName = async () => {
    if (!user?.uid) return;

    const name = nameTrimmed;
    if (name.length < 2) {
      showToast("닉네임은 2글자 이상");
      return;
    }
    if (!nameChanged) {
      showToast("변경된 내용이 없어");
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      await updateUserProfile(user.uid, { displayName: name });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
      showToast("닉네임 저장 완료");
      setIsEditingName(false);
    } catch (e: any) {
      showToast(e?.message ?? "닉네임 저장 실패");
    } finally {
      setSavingName(false);
    }
  };

  const onCancelNameEdit = () => {
    setDisplayName(originalName);
    setIsEditingName(false);
  };

  // ----------------------------
  // Settings update helper (rollback)
  // ----------------------------
  const safeUpdateSettings = async <T,>(
    key: "showQuote" | "reminderEnabled" | "defaultTab",
    next: T,
    rollback: () => void,
    setSaving: (v: boolean) => void,
    successMsg: string
  ) => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateUserSettings(user.uid, { [key]: next } as any);
      qc.invalidateQueries({ queryKey: ["userDoc", user.uid] });
      showToast(successMsg);
    } catch (e: any) {
      rollback();
      showToast(e?.message ?? "설정 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const onToggleQuote = async (v: boolean) => {
    const prev = showQuoteLocal;
    setShowQuoteLocal(v);
    await safeUpdateSettings(
      "showQuote",
      v,
      () => setShowQuoteLocal(prev),
      setSavingQuote,
      "설정 저장 완료"
    );
  };

  const onToggleReminder = async (v: boolean) => {
    const prev = reminderEnabledLocal;
    setReminderEnabledLocal(v);
    await safeUpdateSettings(
      "reminderEnabled",
      v,
      () => setReminderEnabledLocal(prev),
      setSavingReminder,
      "설정 저장 완료"
    );
  };

  const onChangeDefaultTab = async (v: string) => {
    const next = (v as DefaultTab) || "home";
    const prev = defaultTabLocal;
    if (next === prev) return;

    setDefaultTabLocal(next);
    await safeUpdateSettings(
      "defaultTab",
      next,
      () => setDefaultTabLocal(prev),
      setSavingDefaultTab,
      "기본 탭 저장 완료"
    );
  };

  // ----------------------------
  // Password change handler (NO email reset)
  // ----------------------------
  const onChangePassword = async () => {
    if (!auth.currentUser || !email) {
      showToast("이메일/비밀번호 계정만 변경 가능해");
      return;
    }

    if (!currentPw || currentPw.trim().length < 1) {
      showToast("현재 비밀번호를 입력해");
      return;
    }

    if (newPw.length < 8) {
      showToast("새 비밀번호는 8자 이상");
      return;
    }

    if (newPw !== newPw2) {
      showToast("새 비밀번호가 서로 달라");
      return;
    }

    if (newPw === currentPw) {
      showToast("현재 비밀번호와 새 비밀번호가 같아");
      return;
    }

    setSavingPw(true);
    try {
      // ✅ 재인증(필수): 이메일 인증메일 같은 건 안 보내고, 현재 비번으로 바로 검증
      const cred = EmailAuthProvider.credential(email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, cred);

      // ✅ 즉시 변경
      await updatePassword(auth.currentUser, newPw);

      // cleanup
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
      setPwOpen(false);

      showToast("비밀번호 변경 완료");
    } catch (e: any) {
      // 흔한 에러:
      // auth/wrong-password, auth/too-many-requests, auth/requires-recent-login
      showToast(e?.message ?? "비밀번호 변경 실패");
    } finally {
      setSavingPw(false);
    }
  };

  const onLogout = async () => {
    try {
      await auth.signOut();
    } catch (e: any) {
      showToast(e?.message ?? "로그아웃 실패");
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Card>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">로그인이 필요해</Text>
            <Text style={{ opacity: 0.7 }}>
              프로필/설정은 로그인 후 사용할 수 있다.
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineMedium">Profile</Text>
        <Text style={{ opacity: 0.7 }}>{email}</Text>
      </View>

      {isLoading ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.7 }}>프로필을 불러오는 중...</Text>
          </Card.Content>
        </Card>
      ) : null}

      {/* ----------------- Nickname ----------------- */}
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="titleMedium">닉네임</Text>

            {!isEditingName ? (
              <IconButton
                icon="pencil"
                onPress={() => setIsEditingName(true)}
                disabled={isLoading || anySaving}
              />
            ) : null}
          </View>

          {!isEditingName ? (
            <>
              <Text style={{ fontSize: 18, fontWeight: "800" }}>
                {originalName || "나"}
              </Text>
              <Text style={{ opacity: 0.6, fontSize: 12 }}>
                연필을 눌러 수정 (홈/리포트 표시 이름)
              </Text>
            </>
          ) : (
            <>
              <TextInput
                mode="outlined"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="2글자 이상"
                disabled={savingName}
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="contained"
                  loading={savingName}
                  disabled={!canSaveName || savingName}
                  onPress={onSaveName}
                  style={{ flex: 1 }}
                >
                  저장
                </Button>
                <Button
                  mode="outlined"
                  disabled={savingName}
                  onPress={onCancelNameEdit}
                  style={{ flex: 1 }}
                >
                  취소
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* ----------------- Settings ----------------- */}
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">설정</Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text>명언(Quote) 표시</Text>
            <Switch
              value={showQuoteLocal}
              onValueChange={onToggleQuote}
              disabled={isLoading || savingQuote || anySaving}
            />
          </View>

          <Divider />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 2 }}>
              <Text>리마인더</Text>
              <Text style={{ opacity: 0.6, fontSize: 12 }}>
                Phase 2 예정 (지금은 토글만 저장)
              </Text>
            </View>
            <Switch
              value={reminderEnabledLocal}
              onValueChange={onToggleReminder}
              disabled={isLoading || savingReminder || anySaving}
            />
          </View>

          <Divider />

          <Text style={{ opacity: 0.7 }}>기본 탭</Text>
          <SegmentedButtons
            value={defaultTabLocal}
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

      {/* ----------------- Security: Change Password (no email reset) ----------------- */}
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="titleMedium">보안</Text>
            <IconButton
              icon={pwOpen ? "chevron-up" : "chevron-down"}
              onPress={() => setPwOpen((v) => !v)}
              disabled={savingPw || anySaving}
            />
          </View>

          <Text style={{ opacity: 0.7 }}>
            이메일 재설정 없이, 여기서 바로 변경한다. (현재 비밀번호는 필요)
          </Text>

          {pwOpen ? (
            <>
              <TextInput
                mode="outlined"
                label="현재 비밀번호"
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry={!pwVisible1}
                right={
                  <TextInput.Icon
                    icon={pwVisible1 ? "eye-off" : "eye"}
                    onPress={() => setPwVisible1((v) => !v)}
                  />
                }
                disabled={savingPw}
              />

              <TextInput
                mode="outlined"
                label="새 비밀번호 (8자 이상)"
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!pwVisible2}
                right={
                  <TextInput.Icon
                    icon={pwVisible2 ? "eye-off" : "eye"}
                    onPress={() => setPwVisible2((v) => !v)}
                  />
                }
                disabled={savingPw}
              />

              <TextInput
                mode="outlined"
                label="새 비밀번호 확인"
                value={newPw2}
                onChangeText={setNewPw2}
                secureTextEntry={!pwVisible3}
                right={
                  <TextInput.Icon
                    icon={pwVisible3 ? "eye-off" : "eye"}
                    onPress={() => setPwVisible3((v) => !v)}
                  />
                }
                disabled={savingPw}
              />

              <Button
                mode="contained"
                loading={savingPw}
                disabled={savingPw || !currentPw || !newPw || !newPw2}
                onPress={onChangePassword}
              >
                비밀번호 변경
              </Button>

              <Text style={{ opacity: 0.6, fontSize: 12 }}>
                * “현재 비밀번호 재입력(재인증)”은 Firebase 보안정책이라 생략 불가.
              </Text>
            </>
          ) : null}
        </Card.Content>
      </Card>

      {/* ----------------- Account ----------------- */}
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">계정</Text>
          <Button mode="outlined" onPress={onLogout} disabled={anySaving}>
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
