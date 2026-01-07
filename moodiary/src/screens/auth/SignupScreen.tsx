import React, { useState } from "react";
import { View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { router } from "expo-router";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSignup = async () => {
    setErr(null);

    if (pw.length < 6) return setErr("비밀번호는 6자 이상");
    if (pw !== pw2) return setErr("비밀번호가 일치하지 않음");

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pw);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message ?? "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="headlineMedium">회원가입</Text>

          <TextInput
            label="Email"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
          <TextInput
            label="Password"
            value={pw}
            secureTextEntry
            onChangeText={setPw}
          />
          <TextInput
            label="Password Confirm"
            value={pw2}
            secureTextEntry
            onChangeText={setPw2}
          />

          {err ? <Text style={{ color: "red" }}>{err}</Text> : null}

          <Button mode="contained" loading={loading} onPress={onSignup}>
            가입하기
          </Button>

          <Button mode="text" onPress={() => router.back()}>
            뒤로
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
