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

/**
 * 材料分类编辑页面
 * 
 * 功能：
 * - 编辑分类名称
 */
export default function EditCategoryScreen() {
  const params = useLocalSearchParams();
  const categoryId = params.id ? Number(params.id) : null;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // 加载分类信息
  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId) {
        Alert.alert("错误", "分类ID无效", [
          { text: "确定", onPress: () => router.back() },
        ]);
        return;
      }

      try {
        setLoadingData(true);
        // TODO: 调用API获取分类信息
        // const response = await api.get(`/api/categories/${categoryId}`);
        // setName(response.data.name);
        
        // 模拟数据
        setName("电池材料");
      } catch (error) {
        console.error("加载分类信息失败:", error);
        Alert.alert("错误", "加载分类信息失败");
      } finally {
        setLoadingData(false);
      }
    };

    loadCategory();
  }, [categoryId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入分类名称");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API更新分类
      // await api.put(`/api/categories/${categoryId}`, { name });
      
      Alert.alert("成功", "分类已更新", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("更新分类失败:", error);
      Alert.alert("错误", "更新分类失败");
    } finally {
      setLoading(false);
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
        <Text className="text-lg font-semibold text-white">修改分类</Text>
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
            placeholder="请填写分类名称"
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
              {loading ? "提交中..." : "修改"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
