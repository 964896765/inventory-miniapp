import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  specs?: string;
  stockQuantity: number;
  warningLevel?: number;
  barcode?: string;
}

/**
 * 材料管理页面（商品列表页风格）
 * 
 * 功能：
 * - 搜索框下方横向显示材料分类标签
 * - 点击分类标签筛选材料列表
 * - 点击材料跳转到详情页
 * - 支持扫码搜索材料
 */
export default function MaterialsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  // 加载材料分类（后端路由：categories.list）
  const { data: categoriesData, isLoading: categoriesLoading } =
    trpc.categories.list.useQuery();

  // 加载材料列表（后端路由：materials.list -> {items,page,...}）
  const activeCategoryId =
    activeCategory === "全部"
      ? null
      : (categoriesData || []).find((c) => c.name === activeCategory)?.id ?? null;

  const {
    data: materialsResp,
    isLoading: materialsLoading,
    refetch,
  } = trpc.materials.list.useQuery({
    categoryId: activeCategoryId,
    keyword: searchQuery.trim() || "",
    page: 1,
    pageSize: 200,
  });

  const materials = (materialsResp?.items || []) as any[];
  const categories = categoriesData || [];

  // 提取分类名称列表
  const categoryNames = ["全部", ...categories.map((c) => c.name)];

  // 后端已支持 keyword/categoryId 过滤，这里仅做兜底（避免空字段报错）
  const filteredMaterials = materials;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
        <Text className="text-lg font-semibold text-white">商品列表</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => {
              // TODO: 打开扫码功能
              Alert.alert("提示", "扫码功能开发中");
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-white text-lg">扫码</Text>
          </Pressable>
        </View>
      </View>

      {/* 搜索框 */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
          <Text className="text-muted mr-2 text-lg">🔍</Text>
          <TextInput
            className="flex-1 text-base text-foreground"
            placeholder="搜索商品名"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable
            onPress={() => {
              // TODO: 打开搜索功能
              Alert.alert("搜索", searchQuery || "请输入搜索内容");
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View className="bg-primary rounded-lg px-4 py-2">
              <Text className="text-white text-sm">搜索</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* 材料分类标签（横向滚动） */}
      <View className="px-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {categoryNames.map((category) => (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View
                className={`px-4 py-2 rounded-full border ${
                  activeCategory === category
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-sm ${
                    activeCategory === category
                      ? "text-white font-semibold"
                      : "text-foreground"
                  }`}
                >
                  {category}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 材料列表 */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {materialsLoading || categoriesLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">加载中...</Text>
          </View>
        ) : filteredMaterials.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">
              {searchQuery ? "未找到匹配的商品" : "暂无商品"}
            </Text>
            <Pressable
              onPress={() => router.push("/materials/add" as any)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-primary mt-2">点击添加</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {filteredMaterials.map((material) => (
              <Pressable
                key={material.id}
                onPress={() =>
                  router.push(`/materials/detail?id=${material.id}` as any)
                }
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="bg-surface rounded-xl p-4 border border-border">
                  {/* 材料名称和编号 */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-foreground flex-1">
                      {material.name}
                    </Text>
                    <Text className="text-sm text-muted">
                      {material.code || "无编码"}
                    </Text>
                  </View>

                  {/* 材料分类和单位标签 */}
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    <View className="bg-primary/10 px-2 py-1 rounded">
                      <Text className="text-xs text-primary">
                        {categories.find((c) => c.id === material.category_id)?.name || "未分类"}
                      </Text>
                    </View>
                    <View className="bg-success/10 px-2 py-1 rounded">
                      <Text className="text-xs text-success">
                        {material.unit}
                      </Text>
                    </View>
                    {material.spec && (
                      <View className="bg-muted/10 px-2 py-1 rounded">
                        <Text className="text-xs text-muted">
                          {material.spec}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 库存信息 */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">单位: {material.unit || ""}</Text>
                    <Pressable
                      onPress={() => router.push(`/materials/detail?id=${material.id}` as any)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-primary text-sm">详情</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
