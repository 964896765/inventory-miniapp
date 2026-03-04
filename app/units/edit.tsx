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
import { useColors } from "@/hooks/use-colors";

/**
 * 材料单位编辑页面
 */
export default function EditUnitScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 加载单位数据
  useEffect(() => {
    const loadUnit = async () => {
      try {
        setInitialLoading(true);
        // TODO: 调用API获取单位详情
        // const response = await api.get(`/api/units/${id}`);
        
        // 模拟数据
        const mockData = {
          id: parseInt(id || "0"),
          name: "米",
          symbol: "m",
        };
        
        setName(mockData.name);
        setSymbol(mockData.symbol);
      } catch (error) {
        console.error("加载单位失败:", error);
        Alert.alert("错误", "加载单位失败");
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadUnit();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入单位名称");
      return;
    }

    if (!symbol.trim()) {
      Alert.alert("提示", "请输入单位符号");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API更新单位
      // await api.put(`/api/units/${id}`, { name, symbol });
      
      Alert.alert("成功", "单位已更新", [
        { text: "确定", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("更新单位失败:", error);
      Alert.alert("错误", "更新单位失败");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
        <Text className="text-lg font-semibold text-white">编辑单位</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* 单位名称 */}
        <View className="mb-4">
          <Text className="text-foreground text-sm font-medium mb-2">
            单位名称 <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="请输入单位名称"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 单位符号 */}
        <View className="mb-6">
          <Text className="text-foreground text-sm font-medium mb-2">
            单位符号 <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="请输入单位符号（如: m, kg, L）"
            placeholderTextColor={colors.muted}
            value={symbol}
            onChangeText={setSymbol}
          />
        </View>

        {/* 提交按钮 */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              {loading ? "提交中..." : "保存"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
