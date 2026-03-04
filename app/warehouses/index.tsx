import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useActionSheet } from "@expo/react-native-action-sheet";

interface Warehouse {
  id: number;
  name: string;
  parentId: number | null;
  children?: Warehouse[];
  isExpanded?: boolean;
}

/**
 * 仓库管理页面
 * 
 * 功能：
 * - 显示二级仓库列表（父仓库和子仓库）
 * - 支持展开/收起子仓库
 * - 长按显示操作菜单（新增子仓库/修改/删除）
 * - 支持新增一级仓库
 */
export default function WarehousesScreen() {
  const colors = useColors();
  const { showActionSheetWithOptions } = useActionSheet();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // 使用tRPC hook加载仓库列表
  const { data, isLoading, refetch } = trpc.warehouses.list.useQuery();
  const deleteMutation = trpc.warehouses.delete.useMutation();

  // 构建二级结构
  useEffect(() => {
    if (data) {
      const parentWarehouses = data.filter((w: any) => !w.parentId);
      const warehousesWithChildren: Warehouse[] = parentWarehouses.map((parent: any) => ({
        ...parent,
        isExpanded: false,
        children: data.filter((w: any) => w.parentId === parent.id),
      }));
      setWarehouses(warehousesWithChildren);
    }
  }, [data]);

  const onRefresh = async () => {
    await refetch();
  };

  // 切换展开/收起
  const toggleExpand = (warehouseId: number) => {
    setWarehouses((prev) =>
      prev.map((warehouse) =>
        warehouse.id === warehouseId
          ? { ...warehouse, isExpanded: !warehouse.isExpanded }
          : warehouse
      )
    );
  };

  // 长按显示操作菜单（底部ActionSheet）
  const handleLongPress = (warehouse: Warehouse) => {
    const options = ["新增子仓库/货架", "修改", "删除", "取消"];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        title: warehouse.name,
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          // 新增子仓库
          router.push(`/warehouses/add?parentId=${warehouse.id}`);
        } else if (buttonIndex === 1) {
          // 修改
          router.push(`/warehouses/edit?id=${warehouse.id}`);
        } else if (buttonIndex === 2) {
          // 删除
          handleDelete(warehouse.id);
        }
      }
    );
  };

  // 删除仓库
  const handleDelete = async (warehouseId: number) => {
    Alert.alert("确认删除", "确定要删除这个仓库吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: warehouseId });
            await refetch();
            Alert.alert("成功", "仓库已删除");
          } catch (error) {
            console.error("删除仓库失败:", error);
            Alert.alert("错误", "删除仓库失败");
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
        <Text className="text-lg font-semibold text-white">仓库管理</Text>
        <Pressable
          onPress={() => router.push("/warehouses/add")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-white text-2xl">⊕</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">加载中...</Text>
          </View>
        ) : warehouses.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">暂无仓库</Text>
            <Pressable
              onPress={() => router.push("/warehouses/add")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-primary mt-2">点击添加</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-4 pt-4">
            {warehouses.map((warehouse) => (
              <View key={warehouse.id} className="mb-3">
                {/* 一级仓库 */}
                <Pressable
                  onPress={() => toggleExpand(warehouse.id)}
                  onLongPress={() => handleLongPress(warehouse)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {warehouse.name}
                      </Text>
                      {warehouse.children && warehouse.children.length > 0 && (
                        <Text className="text-xs text-muted ml-2">
                          ({warehouse.children.length})
                        </Text>
                      )}
                    </View>
                    {warehouse.children && warehouse.children.length > 0 && (
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color={colors.muted}
                        style={{
                          transform: [
                            { rotate: warehouse.isExpanded ? "90deg" : "0deg" },
                          ],
                        }}
                      />
                    )}
                    <Pressable
                      onPress={() => handleLongPress(warehouse)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-muted text-xl ml-2">⋯</Text>
                    </Pressable>
                  </View>
                </Pressable>

                {/* 子仓库列表 */}
                {warehouse.isExpanded &&
                  warehouse.children &&
                  warehouse.children.length > 0 && (
                    <View className="ml-6 mt-2">
                      {warehouse.children.map((child) => (
                        <Pressable
                          key={child.id}
                          onPress={() =>
                            router.push(`/warehouses/edit?id=${child.id}`)
                          }
                          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        >
                          <View className="bg-background rounded-lg p-3 mb-2 border border-border flex-row items-center justify-between">
                            <Text className="text-sm text-foreground">
                              {child.name}
                            </Text>
                            <Pressable
                              onPress={() => handleDelete(child.id)}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                              })}
                            >
                              <Text className="text-error text-sm">删除</Text>
                            </Pressable>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
