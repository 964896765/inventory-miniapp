import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

/**
 * 材料单位新增页面
 */
export default function AddUnitScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);

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
      // TODO: 调用API创建单位
      // await api.post('/api/units', { name, symbol });
      
      Alert.alert("成功", "单位已添加", [
        { text: "确定", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("添加单位失败:", error);
      Alert.alert("错误", "添加单位失败");
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
        <Text className="text-lg font-semibold text-white">新增单位</Text>
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
              {loading ? "提交中..." : "添加"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
