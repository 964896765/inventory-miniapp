import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

type UnitType = "customer" | "supplier" | "other";

interface SupplyUnitDetail {
  id: number;
  name: string;
  type: UnitType;
  contact?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 供需单位详情页面
 * 
 * 功能：
 * - 查看单位完整信息
 * - 编辑单位
 * - 删除单位
 */
export default function SupplyUnitDetailScreen() {
  const params = useLocalSearchParams();
  const unitId = params.id ? Number(params.id) : null;

  const [unit, setUnit] = useState<SupplyUnitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载单位详情
  useEffect(() => {
    const loadUnit = async () => {
      if (!unitId) {
        Alert.alert("错误", "单位ID无效", [
          { text: "确定", onPress: () => router.back() },
        ]);
        return;
      }

      try {
        setLoading(true);
        // TODO: 调用API获取单位详情
        // const response = await api.get(`/api/supply-units/${unitId}`);
        // setUnit(response.data);
        
        // 模拟数据
        setUnit({
          id: unitId,
          name: "生产部",
          type: "customer",
          contact: "张三",
          phone: "13800138001",
          address: "深圳市南山区科技园",
          notes: "主要负责电池生产",
          createdAt: "2024-01-15 10:30:00",
          updatedAt: "2024-02-17 09:50:00",
        });
      } catch (error) {
        console.error("加载单位详情失败:", error);
        Alert.alert("错误", "加载单位详情失败");
      } finally {
        setLoading(false);
      }
    };

    loadUnit();
  }, [unitId]);

  // 删除单位
  const handleDelete = async () => {
    Alert.alert("确认删除", "确定要删除这个单位吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            // TODO: 调用API删除单位
            // await api.delete(`/api/supply-units/${unitId}`);
            Alert.alert("成功", "单位已删除", [
              {
                text: "确定",
                onPress: () => router.back(),
              },
            ]);
          } catch (error) {
            console.error("删除单位失败:", error);
            Alert.alert("错误", "删除单位失败");
          }
        },
      },
    ]);
  };

  // 获取类型标签
  const getTypeLabel = (type: UnitType) => {
    const labels = {
      customer: "部门",
      supplier: "供应商",
      other: "其它",
    };
    return labels[type];
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">加载中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!unit) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">单位不存在</Text>
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
        <Text className="text-lg font-semibold text-white">单位详情</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/supply-units/edit?id=${unitId}` as any)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-white text-sm">编辑</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-white text-sm">删除</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* 基本信息 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-3">
            {unit.name}
          </Text>
          
          <View className="mb-3">
            <View className="bg-primary/10 px-3 py-1 rounded-lg self-start">
              <Text className="text-sm" style={{ color: "#5B7FC7" }}>
                {getTypeLabel(unit.type)}
              </Text>
            </View>
          </View>
        </View>

        {/* 联系信息 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">
            联系信息
          </Text>
          
          {unit.contact && (
            <View className="mb-2">
              <Text className="text-sm text-muted mb-1">联系人</Text>
              <Text className="text-base text-foreground">{unit.contact}</Text>
            </View>
          )}
          
          {unit.phone && (
            <View className="mb-2">
              <Text className="text-sm text-muted mb-1">联系电话</Text>
              <Text className="text-base text-foreground">{unit.phone}</Text>
            </View>
          )}
          
          {unit.address && (
            <View>
              <Text className="text-sm text-muted mb-1">地址</Text>
              <Text className="text-base text-foreground">{unit.address}</Text>
            </View>
          )}
        </View>

        {/* 其他信息 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">
            其他信息
          </Text>
          
          {unit.notes && (
            <View className="mb-2">
              <Text className="text-sm text-muted mb-1">备注</Text>
              <Text className="text-base text-foreground">{unit.notes}</Text>
            </View>
          )}
          
          <View className="mb-2">
            <Text className="text-sm text-muted mb-1">创建时间</Text>
            <Text className="text-base text-foreground">{unit.createdAt}</Text>
          </View>
          
          <View>
            <Text className="text-sm text-muted mb-1">更新时间</Text>
            <Text className="text-base text-foreground">{unit.updatedAt}</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
