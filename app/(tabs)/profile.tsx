import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handlePress = async (action: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => void 0);
    }

    switch (action) {
      case "个人信息":
        router.push("/profile/personal-info" as any);
        break;
      case "团队管理":
        router.push("/profile/team-info" as any);
        break;
      case "成员管理":
        router.push("/profile/member-management" as any);
        break;
      case "权限配置":
        router.push("/profile/permission-config" as any);
        break;
      case "审批配置":
        router.push("/profile/approval-config" as any);
        break;
      case "退出登录":
        Alert.alert("退出登录", "确定要退出吗？", [
          { text: "取消", style: "cancel" },
          {
            text: "退出",
            style: "destructive",
            onPress: async () => {
              await logout();
              router.replace("/login");
            },
          },
        ]);
        break;
      default:
        break;
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1">
        <View className="bg-primary p-6 pb-12">
          <View className="flex-row items-center">
            <Pressable onPress={() => handlePress("个人信息")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mr-4">
                <Text className="text-4xl">👤</Text>
              </View>
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{user?.name || user?.username || "未登录"}</Text>
              <Text className="text-white/80 text-sm mt-1">账号密码登录</Text>
            </View>
          </View>
        </View>

        <View className="px-4 -mt-8">
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">账户管理</Text>

            <Pressable
              onPress={() => handlePress("个人信息")}
              className="flex-row items-center py-3 border-b border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">👤</Text>
              </View>
              <Text className="flex-1 text-foreground">个人信息</Text>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>

            <Pressable
              onPress={() => handlePress("团队管理")}
              className="flex-row items-center py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">👥</Text>
              </View>
              <Text className="flex-1 text-foreground">团队管理</Text>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>
          </View>

          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">权限与审批</Text>

            <Pressable
              onPress={() => handlePress("成员管理")}
              className="flex-row items-center py-3 border-b border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">👨‍💼</Text>
              </View>
              <Text className="flex-1 text-foreground">成员管理</Text>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>

            <Pressable
              onPress={() => handlePress("权限配置")}
              className="flex-row items-center py-3 border-b border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">🔐</Text>
              </View>
              <Text className="flex-1 text-foreground">权限配置</Text>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>

            <Pressable
              onPress={() => handlePress("审批配置")}
              className="flex-row items-center py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">📋</Text>
              </View>
              <Text className="flex-1 text-foreground">审批配置</Text>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>
          </View>

          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">其他</Text>

            <Pressable
              onPress={() => handlePress("退出登录")}
              className="flex-row items-center py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">🚪</Text>
              </View>
              <Text className="flex-1 text-foreground">退出登录</Text>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>
          </View>
        </View>

        <View className="items-center py-6">
          <Text className="text-muted text-xs">库存管理工具 v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
