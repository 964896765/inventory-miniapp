import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";

export default function PersonalInfoScreen() {
  const { user } = useAuth();

  return (
    <>
      <Stack.Screen options={{ title: "个人信息" }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#eee" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>账户信息</Text>
          <Text style={{ marginBottom: 8 }}>用户名：{user?.username ?? "-"}</Text>
          <Text style={{ marginBottom: 8 }}>姓名：{user?.name ?? "-"}</Text>
          <Text style={{ opacity: 0.6 }}>（后续可在此扩展头像/手机号/修改密码等功能）</Text>
        </View>
      </ScrollView>
    </>
  );
}
