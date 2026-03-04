import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { apiUrl, getApiBaseUrl, setApiBaseUrl } from "@/lib/api-base";
import { clearUserInfo, removeSessionToken } from "@/lib/_core/auth";

export default function SettingsScreen() {
  const [base, setBase] = useState("");
  const [resolvedTrpc, setResolvedTrpc] = useState<string>("");

  useEffect(() => {
    (async () => {
      const v = await getApiBaseUrl();
      setBase(v);
      setResolvedTrpc(await apiUrl("/trpc"));
    })();
  }, []);

  const onSave = async () => {
    try {
      await setApiBaseUrl(base);
      setResolvedTrpc(await apiUrl("/trpc"));
      Alert.alert("已保存", "API 地址已更新，返回后会自动生效");
    } catch (e: any) {
      Alert.alert("保存失败", e?.message ?? String(e));
    }
  };

  const onLogout = async () => {
    await removeSessionToken();
    await clearUserInfo();
    Alert.alert("已退出", "请重新登录");
    router.replace("/auth/login" as any);
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="p-4 gap-4">
        <View className="bg-surface border border-border rounded-2xl p-4">
          <Text className="text-base font-semibold text-foreground">API 地址</Text>
          <Text className="text-muted text-xs mt-1">
            例：http://192.168.1.10:3000/api（必须包含 /api）
          </Text>

          <TextInput
            value={base}
            onChangeText={setBase}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://.../api"
            className="mt-3 px-3 py-2 border border-border rounded-xl text-foreground"
          />

          <Text className="text-muted text-xs mt-2">当前 tRPC：{resolvedTrpc}</Text>

          <Pressable
            onPress={onSave}
            className="mt-4 bg-primary rounded-xl py-3 items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-white font-semibold">保存</Text>
          </Pressable>
        </View>

        <View className="bg-surface border border-border rounded-2xl p-4">
          <Text className="text-base font-semibold text-foreground">账户</Text>
          <Pressable
            onPress={onLogout}
            className="mt-3 bg-red-500 rounded-xl py-3 items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-white font-semibold">退出登录</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
