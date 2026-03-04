import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useDocDraft } from "@/lib/stores/doc-draft";

/**
 * 材料选择页面（参考"选择商品"截图）
 * 
 * 功能：
 * 1. 顶部"显示0库存"按钮和搜索框
 * 2. 分类标签（隔膜、电解液、三元等）
 * 3. 材料列表（显示编号、规格、库存）
 * 4. 点击材料弹出数量和单价输入弹窗
 * 5. 弹窗包含：材料信息、库存、数量加减按钮、单价显示、移除/确定按钮
 * 6. 底部显示"已选:X"和"确定"按钮
 * 7. 确定后返回操作页面并显示已选材料列表
 */

type Material = {
  id: number;
  code: string;
  name: string;
  spec: string;
  stock: number;
  unit: string;
  price: number;
  category: string;
};

type SelectedMaterial = Material & {
  quantity: number;
};

const mockMaterials: Material[] = [
  {
    id: 1,
    code: "B14-01-0077",
    name: "隔膜",
    spec: "76mm*32mm",
    stock: 0,
    unit: "m²",
    price: 0.2,
    category: "隔膜",
  },
  {
    id: 2,
    code: "B15-01-0055",
    name: "电解液",
    spec: "dghj",
    stock: 1,
    unit: "kg",
    price: 99,
    category: "电解液",
  },
];

export default function SelectMaterialsScreen() {
  const colors = useColors();
  const draft = useDocDraft();
  const params = useLocalSearchParams();
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [tempSearchText, setTempSearchText] = useState("");
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>(() => {
    // preload from draft
    return draft.lines.map((l) => ({
      id: l.materialId,
      code: l.sku ?? "",
      name: l.name,
      spec: "",
      stock: 0,
      unit: l.unit ?? "",
      price: 0,
      category: "",
      quantity: l.quantity ?? 1,
    }));
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // 使用tRPC加载材料分类和材料列表
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const { data: materialsData } = trpc.materials.list.useQuery();

  useEffect(() => {
    if (categoriesData) {
      const categoryNames = categoriesData.map((c: any) => c.name);
      setCategories(categoryNames);
      if (categoryNames.length > 0 && !activeCategory) {
        setActiveCategory(categoryNames[0]);
      }
    }
  }, [categoriesData]);

  useEffect(() => {
    if (materialsData) {
      setMaterials(
        materialsData.map((m: any) => ({
          id: m.id,
          code: m.code || "",
          name: m.name,
          spec: m.spec || "",
          stock: 0, // TODO: 从库存表获取实际库存
          unit: m.unit || "",
          price: m.inPrice || 0,
          category: m.categoryName || "",
        }))
      );
    }
  }, [materialsData]);

  const filteredMaterials = materials.filter((m) => {
    if (!showZeroStock && m.stock === 0) return false;
    if (activeCategory && m.category !== activeCategory) return false;
    if (searchText && !m.code.includes(searchText) && !m.name.includes(searchText)) return false;
    return true;
  });

  const handleMaterialPress = (material: Material) => {
    setCurrentMaterial(material);
    setQuantity(1);
    setModalVisible(true);
  };

  const handleConfirmMaterial = () => {
    if (currentMaterial) {
      const existing = selectedMaterials.find((m) => m.id === currentMaterial.id);
      if (existing) {
        setSelectedMaterials(
          selectedMaterials.map((m) =>
            m.id === currentMaterial.id ? { ...m, quantity } : m
          )
        );
      } else {
        setSelectedMaterials([...selectedMaterials, { ...currentMaterial, quantity }]);
      }
    }
    setModalVisible(false);
  };

  const handleRemoveMaterial = () => {
    if (currentMaterial) {
      setSelectedMaterials(selectedMaterials.filter((m) => m.id !== currentMaterial.id));
    }
    setModalVisible(false);
  };

  const handleConfirmSelection = () => {
    // 写回到草稿（各操作页面共享）
    draft.setLines(
      selectedMaterials.map((m) => ({
        materialId: m.id,
        name: m.name,
        sku: m.code,
        unit: m.unit,
        quantity: m.quantity,
      }))
    );
    router.back();
  };

  const handleOpenSearch = () => {
    setTempSearchText(searchText);
    setSearchModalVisible(true);
  };

  const handleConfirmSearch = () => {
    setSearchText(tempSearchText);
    setSearchModalVisible(false);
  };

  const handleClearSearch = () => {
    setTempSearchText("");
  };

  return (
    <ScreenContainer>
      {/* 头部 */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-primary">
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">选择材料</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 顶部工具栏 */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-border">
        <Pressable
          onPress={() => setShowZeroStock(!showZeroStock)}
          className="px-4 py-2 rounded-lg mr-3"
          style={({ pressed }) => [
            {
              backgroundColor: showZeroStock ? colors.primary : "#f0f0f0",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            className={`text-sm font-semibold ${
              showZeroStock ? "text-white" : "text-foreground"
            }`}
          >
            显示0库存
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOpenSearch}
          className="flex-1 flex-row items-center px-3 py-2 bg-background rounded-lg"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          <Text className="flex-1 ml-2 text-base" style={{ color: searchText ? colors.foreground : colors.muted }}>
            {searchText || "搜索"}
          </Text>
        </Pressable>
      </View>

      {/* 分类标签（横向滚动，不向下延伸） */}
      <View className="bg-white border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              className="px-4 py-3 mr-2"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text
                className={`text-base font-semibold ${
                  activeCategory === category ? "text-primary" : "text-muted"
                }`}
              >
                {category}
              </Text>
              {activeCategory === category && (
                <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 材料列表 */}
      <ScrollView className="flex-1 bg-background">
        {filteredMaterials.map((material) => (
          <Pressable
            key={material.id}
            onPress={() => handleMaterialPress(material)}
            className="flex-row items-center px-4 py-4 bg-white border-b border-border"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground mb-1">
                {material.code}（{material.spec}）
              </Text>
              <Text className="text-sm text-success">
                库存:{material.stock} {material.unit}
              </Text>
            </View>
          </Pressable>
        ))}

        {filteredMaterials.length === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-muted text-base">------没有更多材料了------</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View className="flex-row items-center px-4 py-3 bg-white border-t border-border">
        <Text className="text-base text-foreground mr-4">
          已选:<Text className="text-error">{selectedMaterials.length}</Text>
        </Text>
        <Pressable
          onPress={handleConfirmSelection}
          className="flex-1 py-3 rounded-lg items-center"
          style={({ pressed }) => [
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text className="text-white text-base font-semibold">确定</Text>
        </Pressable>
      </View>

      {/* 数量和单价输入弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="w-11/12 bg-white rounded-2xl p-6">
            {currentMaterial && (
              <>
                {/* 材料信息 */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-foreground">
                    {currentMaterial.code}（{currentMaterial.spec}）
                  </Text>
                  <Pressable onPress={() => setModalVisible(false)}>
                    <Text className="text-2xl text-muted">×</Text>
                  </Pressable>
                </View>

                <Text className="text-sm text-success mb-6">
                  库存:{currentMaterial.stock} {currentMaterial.unit}
                  （成本均价:{currentMaterial.price.toFixed(2)}）
                </Text>

                {/* 数量输入 */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-base text-foreground">数量</Text>
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 items-center justify-center bg-background rounded-lg"
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text className="text-xl text-foreground">-</Text>
                    </Pressable>
                    <TextInput
                      value={quantity > 0 ? String(quantity) : ""}
                      onChangeText={(text) => {
                        const num = text === "" ? 0 : Number(text);
                        setQuantity(num);
                      }}
                      keyboardType="numeric"
                      placeholder="请输入数量"
                      className="flex-1 h-10 mx-2 text-center text-lg text-foreground border border-border rounded-lg"
                      style={{ minWidth: 100 }}
                    />
                    <Pressable
                      onPress={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 items-center justify-center bg-background rounded-lg"
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text className="text-xl text-foreground">+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* 单价显示 */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-base text-foreground">单价</Text>
                  <Text className="text-lg text-foreground">{currentMaterial.price.toFixed(1)}</Text>
                </View>

                {/* 底部按钮 */}
                <View className="flex-row">
                  <Pressable
                    onPress={handleRemoveMaterial}
                    className="flex-1 mr-2 py-3 rounded-lg items-center"
                    style={({ pressed }) => [
                      { backgroundColor: "#ccc", opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text className="text-white text-base font-semibold">移除</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmMaterial}
                    className="flex-1 ml-2 py-3 rounded-lg items-center"
                    style={({ pressed }) => [
                      { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text className="text-white text-base font-semibold">确定</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 搜索弹窗 */}
      <Modal
        visible={searchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <Pressable
          onPress={() => setSearchModalVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="w-11/12 bg-white rounded-2xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">搜索材料</Text>
              <Pressable onPress={() => setSearchModalVisible(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </Pressable>
            </View>

            {/* 搜索输入框 */}
            <TextInput
              value={tempSearchText}
              onChangeText={setTempSearchText}
              placeholder="输入材料名、规格、备注进行搜索"
              placeholderTextColor={colors.muted}
              className="px-4 py-3 mb-4 text-base text-foreground border border-border rounded-lg"
              autoFocus
            />

            {/* 底部按钮 */}
            <View className="flex-row">
              <Pressable
                onPress={handleClearSearch}
                className="flex-1 mr-2 py-3 rounded-lg items-center"
                style={({ pressed }) => [
                  { backgroundColor: "#ccc", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text className="text-white text-base font-semibold">清空</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSearch}
                className="flex-1 ml-2 py-3 rounded-lg items-center"
                style={({ pressed }) => [
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text className="text-white text-base font-semibold">确定</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
