import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface Unit {
  id: number;
  name: string;
  symbol: string;
}

/**
 * 材料单位管理页面
 * 
 * 功能：
 * - 显示单位列表
 * - 支持新增/编辑/删除单位
 */
export default function UnitsScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载单位列表
  const loadUnits = async () => {
    try {
      setLoading(true);
      // TODO: 调用API获取单位列表
      // const response = await api.get('/api/units');
      
      // 模拟数据
      const mockData: Unit[] = [
        { id: 1, name: "个", symbol: "个" },
        { id: 2, name: "米", symbol: "m" },
        { id: 3, name: "千克", symbol: "kg" },
        { id: 4, name: "升", symbol: "L" },
        { id: 5, name: "平方米", symbol: "m²" },
      ];
      
      setUnits(mockData);
    } catch (error) {
      console.error("加载单位列表失败:", error);
      Alert.alert("错误", "加载单位列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUnits();
    setRefreshing(false);
  };

  // 删除单位
  const handleDelete = async (unitId: number) => {
    Alert.alert("确认删除", "确定要删除这个单位吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            // TODO: 调用API删除单位
            // await api.delete(`/api/units/${unitId}`);
            await loadUnits();
            Alert.alert("成功", "单位已删除");
          } catch (error) {
            console.error("删除单位失败:", error);
            Alert.alert("错误", "删除单位失败");
          }
        },
      },
    ]);
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
        <Text className="text-lg font-semibold text-white">材料单位管理</Text>
        <Pressable
          onPress={() => router.push("/units/add")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="py-8 items-center">
            <Text className="text-muted">加载中...</Text>
          </View>
        ) : units.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-muted">暂无单位</Text>
          </View>
        ) : (
          <View className="gap-3 pb-4">
            {units.map((unit) => (
              <View
                key={unit.id}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground mb-1">
                      {unit.name}
                    </Text>
                    <Text className="text-sm text-muted">
                      符号: {unit.symbol}
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        // TODO: 通过路由参数返回选中的单位
                        router.back();
                      }}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-success text-sm font-medium">
                        选中
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push(`/units/edit?id=${unit.id}` as any)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-primary text-sm font-medium">
                        编辑
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(unit.id)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-error text-sm font-medium">
                        删除
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
