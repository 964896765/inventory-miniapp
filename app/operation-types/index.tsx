import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

/**
 * 出入库类型管理页面
 * 
 * 两个标签页：
 * 1. 入库类型（采购入库、归还入库、盘点入库、退货入库）
 * 2. 出库类型（销售出库、领用出库、盘点出库、退货出库）
 * 
 * 功能：
 * - 新增类型
 * - 编辑类型
 * - 删除类型
 * - 排序
 */

type OperationType = {
  id: number;
  name: string;
  type: "in" | "out";
};

const defaultInTypes: OperationType[] = [
  { id: 1, name: "采购入库", type: "in" },
  { id: 2, name: "归还入库", type: "in" },
  { id: 3, name: "盘点入库", type: "in" },
  { id: 4, name: "退货入库", type: "in" },
];

const defaultOutTypes: OperationType[] = [
  { id: 5, name: "销售出库", type: "out" },
  { id: 6, name: "领用出库", type: "out" },
  { id: 7, name: "盘点出库", type: "out" },
  { id: 8, name: "退货出库", type: "out" },
];

export default function OperationTypesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const [inTypes, setInTypes] = useState(defaultInTypes);
  const [outTypes, setOutTypes] = useState(defaultOutTypes);
  const [isReordering, setIsReordering] = useState(false);

  const currentTypes = activeTab === "in" ? inTypes : outTypes;
  const setCurrentTypes = activeTab === "in" ? setInTypes : setOutTypes;

  const handleEdit = (id: number, currentName: string) => {
    Alert.prompt(
      "编辑类型",
      "请输入新的类型名称",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: (name?: string) => {
            if (name && name.trim()) {
              setCurrentTypes(
                currentTypes.map((t) =>
                  t.id === id ? { ...t, name: name.trim() } : t
                )
              );
            }
          },
        },
      ],
      "plain-text",
      currentName
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert("确认删除", "确定要删除这个类型吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          setCurrentTypes(currentTypes.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const handleAdd = () => {
    Alert.prompt(
      "新增类型",
      `请输入${activeTab === "in" ? "入库" : "出库"}类型名称`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: (name?: string) => {
            if (name && name.trim()) {
              const newType: OperationType = {
                id: Date.now(),
                name: name.trim(),
                type: activeTab,
              };
              setCurrentTypes([...currentTypes, newType]);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newTypes = [...currentTypes];
    [newTypes[index - 1], newTypes[index]] = [newTypes[index], newTypes[index - 1]];
    setCurrentTypes(newTypes);
  };

  const handleMoveDown = (index: number) => {
    if (index === currentTypes.length - 1) return;
    const newTypes = [...currentTypes];
    [newTypes[index], newTypes[index + 1]] = [newTypes[index + 1], newTypes[index]];
    setCurrentTypes(newTypes);
  };

  const handleToggleReorder = () => {
    setIsReordering(!isReordering);
    if (isReordering) {
      Alert.alert("保存成功", "排序已保存");
    }
  };

  return (
    <ScreenContainer>
      {/* 头部 */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-primary">
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">库存管理工具|仓库管理</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 标签页 */}
      <View className="flex-row bg-white border-b border-border">
        <Pressable
          onPress={() => setActiveTab("in")}
          className="flex-1 py-4 items-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === "in" ? "text-primary" : "text-muted"
            }`}
          >
            入库类型
          </Text>
          {activeTab === "in" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("out")}
          className="flex-1 py-4 items-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === "out" ? "text-primary" : "text-muted"
            }`}
          >
            出库类型
          </Text>
          {activeTab === "out" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </Pressable>
      </View>

      {/* 类型列表 */}
      <ScrollView className="flex-1 bg-background">
        {currentTypes.map((type, index) => (
          <View
            key={type.id}
            className="flex-row items-center px-4 py-4 bg-white border-b border-border"
          >
            <Text className="text-lg font-semibold text-error mr-3">{index + 1}</Text>
            
            {isReordering ? (
              <>
                <Text className="flex-1 text-base text-foreground">{type.name}</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={({ pressed }) => [{ opacity: pressed || index === 0 ? 0.3 : 1, padding: 8 }]}
                  >
                    <Text className="text-xl text-foreground">↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleMoveDown(index)}
                    disabled={index === currentTypes.length - 1}
                    style={({ pressed }) => [{ opacity: pressed || index === currentTypes.length - 1 ? 0.3 : 1, padding: 8 }]}
                  >
                    <Text className="text-xl text-foreground">↓</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => handleEdit(type.id, type.name)}
                  className="flex-1"
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text className="text-base text-foreground">{type.name}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(type.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 8 }]}
                >
                  <Text className="text-xl text-error">🗑</Text>
                </Pressable>
              </>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 底部按钮 */}
      <View className="flex-row p-4 bg-white border-t border-border">
        <Pressable
          onPress={handleToggleReorder}
          className="flex-1 mr-2 py-3 rounded-lg items-center"
          style={({ pressed }) => [
            { backgroundColor: isReordering ? "#4CAF50" : "#FFA500", opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text className="text-white text-base font-semibold">{isReordering ? "完成" : "排序"}</Text>
        </Pressable>

        <Pressable
          onPress={handleAdd}
          disabled={isReordering}
          className="flex-1 ml-2 py-3 rounded-lg items-center"
          style={({ pressed }) => [
            { backgroundColor: colors.primary, opacity: pressed || isReordering ? 0.5 : 1 },
          ]}
        >
          <Text className="text-white text-base font-semibold">新增</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
