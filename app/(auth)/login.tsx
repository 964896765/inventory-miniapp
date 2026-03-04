import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuth({ autoFetch: false });

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");

  const onSubmit = async () => {
    const res = await login(username.trim(), password);
    if (!res.ok) {
      Alert.alert("登录失败", res.message || "请检查账号密码");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 24 }}>库存管理工具</Text>

      <Text style={{ marginBottom: 6, opacity: 0.7 }}>账号</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="请输入账号"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 16 }}
      />

      <Text style={{ marginBottom: 6, opacity: 0.7 }}>密码</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="请输入密码"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 24 }}
      />

      <Pressable
        onPress={onSubmit}
        disabled={loading}
        style={{
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: loading ? "#999" : "#1f6feb",
        }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>登录</Text>}
      </Pressable>

      <Text style={{ marginTop: 12, opacity: 0.55 }}>默认账号：admin / 123456</Text>
    </View>
  );
}
