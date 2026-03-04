import { useState, useEffect } from "react";
import { View, Text, Pressable, Switch, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

/**
 * 审批配置页面
 * 
 * 功能：
 * 1. 启用/禁用审批
 * 2. 设置审批级别（一级/二级）
 * 3. 设置是否免审自己提交的单据
 * 4. 选择审批人
 */
export default function ApprovalConfigScreen() {
  const colors = useColors();
  
  const [enabled, setEnabled] = useState(false);
  const [level, setLevel] = useState<1 | 2>(1);
  const [exemptSelf, setExemptSelf] = useState(false);
  const [approver1Id, setApprover1Id] = useState<number | undefined>();
  const [approver2Id, setApprover2Id] = useState<number | undefined>();
  
  // 获取审批配置
  const { data: config, refetch } = trpc.approval.getConfig.useQuery();
  
  // 设置审批配置
  const setConfigMutation = trpc.approval.setConfig.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "审批配置已保存");
      refetch();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", "保存失败");
    },
  });
  
  // 加载配置
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setLevel(config.level);
      setExemptSelf(config.exemptSelf);
      setApprover1Id(config.approver1Id);
      setApprover2Id(config.approver2Id);
    }
  }, [config]);
  
  const handleSave = () => {
    setConfigMutation.mutate({
      enabled,
      level,
      exemptSelf,
      approver1Id,
      approver2Id,
    });
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "审批配置",
          headerShown: true,
        }}
      />
      <ScreenContainer className="p-4">
        {/* 启用审批 */}
        <View className="bg-surface rounded-lg p-4 mb-4 border border-border">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground mb-1">
                启用审批
              </Text>
              <Text className="text-sm text-muted">
                开启后，单据提交需要审批通过才能过账
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
        
        {enabled && (
          <>
            {/* 审批级别 */}
            <View className="bg-surface rounded-lg p-4 mb-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                审批级别
              </Text>
              
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLevel(1);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className={`flex-1 py-3 rounded-lg items-center border ${
                    level === 1
                      ? "bg-primary border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      level === 1 ? "text-white" : "text-foreground"
                    }`}
                  >
                    一级审批
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLevel(2);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className={`flex-1 py-3 rounded-lg items-center border ${
                    level === 2
                      ? "bg-primary border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      level === 2 ? "text-white" : "text-foreground"
                    }`}
                  >
                    二级审批
                  </Text>
                </Pressable>
              </View>
            </View>
            
            {/* 免审自己提交的单据 */}
            <View className="bg-surface rounded-lg p-4 mb-4 border border-border">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground mb-1">
                    免审自己的单据
                  </Text>
                  <Text className="text-sm text-muted">
                    开启后，自己提交的单据无需审批直接过账
                  </Text>
                </View>
                <Switch
                  value={exemptSelf}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExemptSelf(value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
            
            {/* 审批人设置 */}
            <View className="bg-surface rounded-lg p-4 mb-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                审批人设置
              </Text>
              
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("提示", "选择审批人功能开发中");
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row justify-between items-center py-3 border-b border-border"
              >
                <Text className="text-foreground">一级审批人</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-muted">
                    {approver1Id ? `用户 ${approver1Id}` : "未设置"}
                  </Text>
                  <Text className="text-muted">›</Text>
                </View>
              </Pressable>
              
              {level === 2 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert("提示", "选择审批人功能开发中");
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-row justify-between items-center py-3"
                >
                  <Text className="text-foreground">二级审批人</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-muted">
                      {approver2Id ? `用户 ${approver2Id}` : "未设置"}
                    </Text>
                    <Text className="text-muted">›</Text>
                  </View>
                </Pressable>
              )}
            </View>
          </>
        )}
        
        {/* 保存按钮 */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          className="bg-primary py-4 rounded-lg items-center mt-4"
        >
          <Text className="text-white font-semibold text-base">保存配置</Text>
        </Pressable>
      </ScreenContainer>
    </>
  );
}
