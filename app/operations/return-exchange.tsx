import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type OperationType = "return" | "exchange" | "adjustment";

/**
 * 退仓/换料/平账页面
 * 
 * 三种操作类型通过Tab切换：
 * 1. 退仓（return）- 材料退回仓库
 * 2. 换料（exchange）- 材料替换
 * 3. 平账（adjustment）- 库存调整
 */
export default function ReturnExchangeScreen() {
  const colors = useColors();
  
  const [operationType, setOperationType] = useState<OperationType>("return");
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  
  // 获取材料列表
  const { data: materials } = trpc.materials.list.useQuery({});
  
  // 提交操作
  const handleSubmit = async () => {
    if (!selectedMaterialId) {
      Alert.alert("提示", "请选择材料");
      return;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert("提示", "请输入有效的数量");
      return;
    }
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // TODO: 调用API创建单据
      // const docType = operationType === "return" ? "return" : operationType === "exchange" ? "exchange" : "adjustment";
      // await trpc.docs.create.mutate({
      //   docType,
      //   materialId: selectedMaterialId,
      //   quantity: parseFloat(quantity),
      //   reason,
      // });
      
      const typeText = operationType === "return" ? "退仓" : operationType === "exchange" ? "换料" : "平账";
      Alert.alert("成功", `${typeText}单已创建`, [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", "操作失败");
    }
  };
  
  const getTitle = () => {
    switch (operationType) {
      case "return":
        return "退仓";
      case "exchange":
        return "换料";
      case "adjustment":
        return "平账";
    }
  };
  
  const getDescription = () => {
    switch (operationType) {
      case "return":
        return "将材料退回仓库";
      case "exchange":
        return "替换材料（如铝塑膜换料）";
      case "adjustment":
        return "调整库存数量";
    }
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "退仓/换料/平账",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        {/* 操作类型Tab */}
        <View className="flex-row bg-surface border-b border-border">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setOperationType("return");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 items-center ${
              operationType === "return" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                operationType === "return" ? "text-primary" : "text-muted"
              }`}
            >
              退仓
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setOperationType("exchange");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 items-center ${
              operationType === "exchange" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                operationType === "exchange" ? "text-primary" : "text-muted"
              }`}
            >
              换料
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setOperationType("adjustment");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 items-center ${
              operationType === "adjustment" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                operationType === "adjustment" ? "text-primary" : "text-muted"
              }`}
            >
              平账
            </Text>
          </Pressable>
        </View>
        
        <ScrollView className="flex-1 p-4">
          {/* 操作说明 */}
          <View className="bg-primary/10 p-3 rounded-lg mb-4">
            <Text className="text-sm text-primary">
              {getDescription()}
            </Text>
          </View>
          
          {/* 材料选择 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              选择材料 <Text className="text-error">*</Text>
            </Text>
            <Pressable
              onPress={() => {
                // TODO: 打开材料选择器
                Alert.alert("提示", "材料选择器开发中");
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="bg-surface border border-border rounded-lg px-4 py-3"
            >
              <Text className={selectedMaterialId ? "text-foreground" : "text-muted"}>
                {selectedMaterialId
                  ? materials?.find((m) => m.id === selectedMaterialId)?.name || "未知材料"
                  : "点击选择材料"}
              </Text>
            </Pressable>
          </View>
          
          {/* 数量输入 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              数量 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="请输入数量"
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>
          
          {/* 原因/备注 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              原因/备注
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              placeholder={`请输入${getTitle()}原因`}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
            />
          </View>
          
          {/* 换料特有：目标材料选择 */}
          {operationType === "exchange" && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                目标材料 <Text className="text-error">*</Text>
              </Text>
              <Pressable
                onPress={() => {
                  Alert.alert("提示", "目标材料选择器开发中");
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="bg-surface border border-border rounded-lg px-4 py-3"
              >
                <Text className="text-muted">点击选择目标材料</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
        
        {/* 底部提交按钮 */}
        <View className="p-4 border-t border-border">
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            className="bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold text-base">
              提交{getTitle()}单
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    </>
  );
}
