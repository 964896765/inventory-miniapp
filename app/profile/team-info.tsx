import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

/**
 * 团队信息页面
 * 
 * 功能：
 * 1. 显示团队基本信息
 * 2. 编辑团队名称、描述等
 * 3. 保存团队信息
 */
export default function TeamInfoScreen() {
  const colors = useColors();
  
  const [isEditing, setIsEditing] = useState(false);
  const [teamName, setTeamName] = useState("我的团队");
  const [teamDescription, setTeamDescription] = useState("这是一个电芯行业原材料管理团队");
  const [teamIndustry, setTeamIndustry] = useState("电芯制造");
  
  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
    Alert.alert("成功", "团队信息已保存");
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "团队管理",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ScrollView className="flex-1">
          {/* 团队信息卡片 */}
          <View className="bg-primary/5 p-6 mb-4">
            <View className="items-center mb-4">
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-3">
                <Text className="text-5xl">🏢</Text>
              </View>
              <Text className="text-xl font-bold text-foreground">{teamName}</Text>
              <Text className="text-sm text-muted mt-1">创建于 2024年1月</Text>
            </View>
          </View>
          
          {/* 团队详细信息 */}
          <View className="bg-surface mx-4 mb-4 p-4 rounded-lg border border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-foreground">
                团队信息
              </Text>
              
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="bg-primary/10 px-4 py-2 rounded"
              >
                <Text className="text-primary text-sm font-medium">
                  {isEditing ? "保存" : "编辑"}
                </Text>
              </Pressable>
            </View>
            
            {/* 团队名称 */}
            <View className="mb-4">
              <Text className="text-sm text-muted mb-2">团队名称</Text>
              {isEditing ? (
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  value={teamName}
                  onChangeText={setTeamName}
                  placeholder="请输入团队名称"
                  placeholderTextColor={colors.muted}
                />
              ) : (
                <Text className="text-base text-foreground">{teamName}</Text>
              )}
            </View>
            
            {/* 团队描述 */}
            <View className="mb-4">
              <Text className="text-sm text-muted mb-2">团队描述</Text>
              {isEditing ? (
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  value={teamDescription}
                  onChangeText={setTeamDescription}
                  placeholder="请输入团队描述"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              ) : (
                <Text className="text-base text-foreground">{teamDescription}</Text>
              )}
            </View>
            
            {/* 所属行业 */}
            <View>
              <Text className="text-sm text-muted mb-2">所属行业</Text>
              {isEditing ? (
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  value={teamIndustry}
                  onChangeText={setTeamIndustry}
                  placeholder="请输入所属行业"
                  placeholderTextColor={colors.muted}
                />
              ) : (
                <Text className="text-base text-foreground">{teamIndustry}</Text>
              )}
            </View>
          </View>
          
          {/* 团队统计 */}
          <View className="bg-surface mx-4 mb-4 p-4 rounded-lg border border-border">
            <Text className="text-base font-semibold text-foreground mb-4">
              团队统计
            </Text>
            
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary mb-1">5</Text>
                <Text className="text-xs text-muted">成员数量</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary mb-1">3</Text>
                <Text className="text-xs text-muted">仓库数量</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary mb-1">120</Text>
                <Text className="text-xs text-muted">材料种类</Text>
              </View>
            </View>
          </View>
          
          {/* 快捷操作 */}
          <View className="bg-surface mx-4 mb-4 rounded-lg border border-border overflow-hidden">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/profile/member-management");
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="flex-row items-center p-4 border-b border-border"
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">👥</Text>
              </View>
              <Text className="flex-1 text-foreground">成员管理</Text>
              <Text className="text-muted">→</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/profile/permission-config");
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="flex-row items-center p-4"
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-xl">🔐</Text>
              </View>
              <Text className="flex-1 text-foreground">权限配置</Text>
              <Text className="text-muted">→</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
