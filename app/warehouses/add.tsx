import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

/**
 * 仓库新增/编辑页面
 * 
 * 功能：
 * - 新增一级仓库
 * - 新增子仓库/货架
 * - 编辑仓库名称
 */
export default function AddWarehouseScreen() {
  const params = useLocalSearchParams();
  const parentId = params.parentId ? Number(params.parentId) : null;
  const isSubWarehouse = parentId !== null;

  const [name, setName] = useState("");
  const createMutation = trpc.warehouses.create.useMutation();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入仓库名称");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        parentId: parentId ?? undefined,
      });
      
      Alert.alert("成功", "仓库已创建", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("创建仓库失败:", error);
      Alert.alert("错误", "创建仓库失败");
    }
  };

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
        <Text className="text-lg font-semibold text-white">
          {isSubWarehouse ? "添加新子仓库" : "添加新仓库"}
        </Text>
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
            placeholder={`请填写${isSubWarehouse ? "子仓库" : "仓库"}名称`}
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
          disabled={createMutation.isPending}
          style={({ pressed }) => ({
            opacity: pressed || createMutation.isPending ? 0.7 : 1,
          })}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              {createMutation.isPending ? "创建中..." : "创建"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
