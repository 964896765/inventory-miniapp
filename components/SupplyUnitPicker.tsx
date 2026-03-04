import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

interface SupplyUnitPickerProps {
  visible: boolean;
  type?: "department" | "supplier" | "other"; // 供需单位类型
  onSelect: (unit: { id: number; name: string }) => void;
  onCancel: () => void;
}

/**
 * 供需单位选择器组件
 * 
 * 功能：
 * 1. 搜索供需单位
 * 2. 列表选择
 * 3. 底部"管理供需单位"按钮跳转到供需单位管理页面
 */
export function SupplyUnitPicker({ visible, type, onSelect, onCancel }: SupplyUnitPickerProps) {
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [units, setUnits] = useState<{ id: number; name: string; type: string }[]>([]);

  // 使用tRPC加载供需单位列表
  const { data, isLoading } = trpc.supplyUnits.list.useQuery();

  useEffect(() => {
    if (data) {
      setUnits(data.map((u: any) => ({ id: u.id, name: u.name, type: u.type })));
    }
  }, [data]);

  const filteredUnits = units.filter((u) => {
    if (type && u.type !== type) return false;
    if (searchText && !u.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const handleSelect = (unit: { id: number; name: string }) => {
    onSelect(unit);
    setSearchText("");
  };

  const handleManage = () => {
    onCancel();
    router.push("/supply-units");
  };

  const getTitle = () => {
    if (type === "department") return "选择部门";
    if (type === "supplier") return "选择供应商";
    return "选择供需单位";
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/50 justify-end">
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl max-h-[80%]">
          {/* 头部 */}
          <View className="px-4 py-4 border-b border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">{getTitle()}</Text>
              <Pressable onPress={onCancel}>
                <Text className="text-2xl text-muted">×</Text>
              </Pressable>
            </View>

            {/* 搜索框 */}
            <View className="flex-row items-center px-3 py-2 bg-background rounded-lg">
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="搜索"
                placeholderTextColor={colors.muted}
                className="flex-1 ml-2 text-base text-foreground"
              />
            </View>
          </View>

          {/* 供需单位列表 */}
          <ScrollView className="flex-1">
            {filteredUnits.map((unit) => (
              <Pressable
                key={unit.id}
                onPress={() => handleSelect(unit)}
                className="px-4 py-4 border-b border-border"
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text className="text-base text-foreground">{unit.name}</Text>
              </Pressable>
            ))}

            {filteredUnits.length === 0 && (
              <View className="items-center justify-center py-20">
                <Text className="text-muted text-base">未找到匹配的供需单位</Text>
              </View>
            )}
          </ScrollView>

          {/* 底部管理按钮 */}
          <View className="px-4 py-3 border-t border-border">
            <Pressable
              onPress={handleManage}
              className="py-3 rounded-xl items-center"
              style={({ pressed }) => [
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text className="text-white text-base font-semibold">管理供需单位</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
