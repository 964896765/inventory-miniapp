import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert, FlatList } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

/**
 * 成员管理页面
 * 
 * 功能：
 * 1. 显示团队成员列表
 * 2. 邀请新成员（通过邮箱）
 * 3. 编辑成员权限
 * 4. 删除成员
 */
export default function MemberManagementScreen() {
  const colors = useColors();
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  
  // 获取成员列表
  const { data: members, refetch } = trpc.team.listMembers.useQuery();
  
  // 邀请成员
  const inviteMutation = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "邀请已发送");
      setInviteEmail("");
      setShowInviteDialog(false);
      refetch();
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", error.message || "邀请失败");
    },
  });
  
  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      Alert.alert("提示", "请输入邮箱地址");
      return;
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      Alert.alert("提示", "请输入有效的邮箱地址");
      return;
    }
    
    inviteMutation.mutate({ email: inviteEmail });
  };
  
  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      owner: "所有者",
      admin: "管理员",
      member: "成员",
    };
    return roleMap[role] || role;
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-error/10 text-error";
      case "admin":
        return "bg-warning/10 text-warning";
      case "member":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted/10 text-muted";
    }
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "成员管理",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <View className="flex-1">
          {/* 邀请按钮 */}
          <View className="p-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowInviteDialog(!showInviteDialog);
              }}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              className="bg-primary py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">邀请新成员</Text>
            </Pressable>
          </View>
          
          {/* 邀请对话框 */}
          {showInviteDialog && (
            <View className="bg-surface mx-4 mb-4 p-4 rounded-lg border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                邀请新成员
              </Text>
              
              <View className="mb-3">
                <Text className="text-sm text-muted mb-2">邮箱地址</Text>
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="请输入邮箱地址"
                  placeholderTextColor={colors.muted}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowInviteDialog(false);
                    setInviteEmail("");
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-1 bg-muted/10 py-3 rounded-lg items-center"
                >
                  <Text className="text-muted font-medium">取消</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleInvite}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  className="flex-1 bg-primary py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">发送邀请</Text>
                </Pressable>
              </View>
            </View>
          )}
          
          {/* 成员列表 */}
          <FlatList
            data={members || []}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View className="bg-surface mx-4 mb-3 p-4 rounded-lg border border-border">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground mb-1">
                      用户 {item.userId}
                    </Text>
                    <Text className="text-xs text-muted">
                      加入时间：{new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View className={`px-3 py-1 rounded ${getRoleColor(item.role)}`}>
                    <Text className="text-xs font-medium">
                      {getRoleText(item.role)}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/profile/member-permissions?id=${item.id}`);
                    }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-1 bg-primary/10 py-2 rounded items-center"
                  >
                    <Text className="text-primary text-sm font-medium">编辑权限</Text>
                  </Pressable>
                  
                  {item.role !== "owner" && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Alert.alert("确认", "确定要移除这个成员吗？", [
                          { text: "取消", style: "cancel" },
                          {
                            text: "移除",
                            style: "destructive",
                            onPress: () => {
                              // TODO: 实现移除成员功能
                              Alert.alert("提示", "移除成员功能开发中");
                            },
                          },
                        ]);
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="bg-error/10 px-4 py-2 rounded items-center"
                    >
                      <Text className="text-error text-sm font-medium">移除</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text className="text-muted">暂无成员</Text>
              </View>
            }
          />
        </View>
      </ScreenContainer>
    </>
  );
}
