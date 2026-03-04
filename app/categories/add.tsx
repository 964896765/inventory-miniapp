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

/**
 * 材料分类新增页面
 * 
 * 功能：
 * - 新增一级分类
 * - 新增子分类
 */
export default function AddCategoryScreen() {
  const params = useLocalSearchParams();
  const parentId = params.parentId ? Number(params.parentId) : null;
  const isSubCategory = parentId !== null;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入分类名称");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API创建分类
      // await api.post('/api/categories', { name, parentId });
      
      Alert.alert("成功", "分类已创建", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("创建分类失败:", error);
      Alert.alert("错误", "创建分类失败");
    } finally {
      setLoading(false);
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
          {isSubCategory ? "添加新子类" : "添加新分类"}
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
            placeholder={`请填写${isSubCategory ? "子分类" : "分类"}名称`}
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
          disabled={loading}
          style={({ pressed }) => ({
            opacity: pressed || loading ? 0.7 : 1,
          })}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              {loading ? "提交中..." : "新增"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
