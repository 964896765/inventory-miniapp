import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

/**
 * 仓库编辑页面
 * 
 * 功能：
 * - 编辑仓库名称
 */
export default function EditWarehouseScreen() {
  const params = useLocalSearchParams();
  const warehouseId = params.id ? Number(params.id) : null;

  const [name, setName] = useState("");
  
  // 使用tRPC hook加载仓库信息
  const { data: warehouse, isLoading: loadingData } = trpc.warehouses.get.useQuery(
    { id: warehouseId! },
    { enabled: !!warehouseId }
  );
  const updateMutation = trpc.warehouses.update.useMutation();

  // 加载仓库信息后设置名称
  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
    }
  }, [warehouse]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入仓库名称");
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: warehouseId!, name: name.trim() });
      
      Alert.alert("成功", "仓库已更新", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("更新仓库失败:", error);
      Alert.alert("错误", "更新仓库失败");
    }
  };

  if (loadingData) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">加载中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      {/* 顶部导航栏 */}
      <View className="bg-primary px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">修改仓库</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* 名称输入 */}
        <View className="mb-6">
          <Text className="text-sm text-foreground mb-2">
            名称 <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请填写仓库名称"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* 提交按钮 */}
        <Pressable
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
          style={({ pressed }) => ({
            opacity: pressed || updateMutation.isPending ? 0.7 : 1,
          })}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
