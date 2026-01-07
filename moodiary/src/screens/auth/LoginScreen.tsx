import React, { useState } from "react";
import { View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message ?? "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="headlineMedium">로그인</Text>

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

          {err ? <Text style={{ color: "red" }}>{err}</Text> : null}

          <Button mode="contained" loading={loading} onPress={onLogin}>
            로그인
          </Button>

          <Button mode="text" onPress={() => router.push("/auth/signup")}>
            회원가입
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
