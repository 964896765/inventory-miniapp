import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface WarehousePickerProps {
  visible: boolean;
  onSelect: (warehouse: { id: number; name: string }) => void;
  onCancel: () => void;
}

/**
 * 仓库选择器组件
 * 
 * 功能：
 * 1. 列表选择仓库
 * 2. 调用仓库管理内的仓库列表
 */
export function WarehousePicker({ visible, onSelect, onCancel }: WarehousePickerProps) {
  const colors = useColors();
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);

  // 使用tRPC加载仓库列表
  const { data, isLoading } = trpc.warehouses.list.useQuery();

  useEffect(() => {
    if (data) {
      // 将所有仓库（父仓库和子仓库）展开为一级列表
      setWarehouses(data.map((w: any) => ({ id: w.id, name: w.name })));
    }
  }, [data]);

  const handleSelect = (warehouse: { id: number; name: string }) => {
    onSelect(warehouse);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/50 justify-end">
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl max-h-[80%]">
          {/* 头部 */}
          <View className="px-4 py-4 border-b border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">选择仓库</Text>
              <Pressable onPress={onCancel}>
                <Text className="text-2xl text-muted">×</Text>
              </Pressable>
            </View>
          </View>

          {/* 仓库列表 */}
          <ScrollView className="flex-1">
            {isLoading && (
              <View className="items-center justify-center py-20">
                <Text className="text-muted text-base">加载中...</Text>
              </View>
            )}

            {!isLoading && warehouses.map((warehouse) => (
              <Pressable
                key={warehouse.id}
                onPress={() => handleSelect(warehouse)}
                className="px-4 py-4 border-b border-border"
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text className="text-base text-foreground">{warehouse.name}</Text>
              </Pressable>
            ))}

            {!isLoading && warehouses.length === 0 && (
              <View className="items-center justify-center py-20">
                <Text className="text-muted text-base">暂无仓库数据</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
