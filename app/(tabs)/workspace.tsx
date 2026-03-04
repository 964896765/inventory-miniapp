import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  RefreshControl,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type TopWarehouse = {
  id: number;
  name: string;
  code: string;
  type: string;
};

export default function WorkspaceScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [keyword, setKeyword] = useState("");
  const [activeWarehouseId, setActiveWarehouseId] = useState<number | null>(null);
  const [activeLeftId, setActiveLeftId] = useState<number | null>(null); // categoryId or departmentId
  const [refreshing, setRefreshing] = useState(false);

  // Ensure top 5 warehouses exist (idempotent)
  const ensureDefaults = trpc.warehouses.ensureDefaults.useMutation();
  const { data: warehouses, isLoading: warehousesLoading } = trpc.warehouses.listTop.useQuery(undefined, {
    staleTime: 30_000,
  });

  // Departments (workshop)
  const { data: departments } = trpc.supplyUnits.listDepartments.useQuery(undefined, {
    enabled: !!warehouses?.length,
  });
  const syncWorkshopDepartments = trpc.inventory.syncWorkshopDepartments.useMutation();

  // Categories (non-workshop)
  const { data: categories } = trpc.categories.list.useQuery(undefined, {
    enabled: !!warehouses?.length,
  });

  const activeWarehouse: TopWarehouse | null = useMemo(() => {
    const list = (warehouses ?? []) as any as TopWarehouse[];
    return activeWarehouseId ? list.find((w) => w.id === activeWarehouseId) ?? null : list[0] ?? null;
  }, [warehouses, activeWarehouseId]);

  const isWorkshop = activeWarehouse?.code === "WORKSHOP" || activeWarehouse?.type === "workshop";

  // Inventory list
  const invByWarehouseQuery = trpc.inventory.getByWarehouse.useQuery(
    {
      warehouseId: activeWarehouse?.id ?? 0,
      keyword: keyword.trim() || undefined,
      page: 1,
      pageSize: 100,
    },
    {
      enabled: !!activeWarehouse && !isWorkshop,
      keepPreviousData: true,
    }
  );

  const invByDeptQuery = trpc.inventory.getByDepartment.useQuery(
    {
      departmentId: activeLeftId ?? 0,
      keyword: keyword.trim() || undefined,
      page: 1,
      pageSize: 100,
    },
    {
      enabled: !!activeWarehouse && isWorkshop && !!activeLeftId,
      keepPreviousData: true,
    }
  );

  // Boot: ensure defaults + pick initial warehouse + left selection
  useEffect(() => {
    ensureDefaults
      .mutateAsync()
      .then(() => utils.warehouses.listTop.invalidate())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!warehouses?.length) return;
    if (!activeWarehouseId) setActiveWarehouseId(warehouses[0].id);
  }, [warehouses, activeWarehouseId]);

  useEffect(() => {
    if (!activeWarehouse) return;

    // Reset keyword on warehouse switch (keeps UI snappy)
    setKeyword((k) => k);

    if (isWorkshop) {
      // Ensure department sub-warehouses exist (idempotent)
      syncWorkshopDepartments.mutateAsync().catch(() => {});

      const firstDept = (departments ?? [])[0];
      setActiveLeftId(firstDept?.id ?? null);
    } else {
      const firstCat = (categories ?? [])[0];
      setActiveLeftId(firstCat?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWarehouse?.id]);

  useEffect(() => {
    if (!isWorkshop) {
      const firstCat = (categories ?? [])[0];
      if (!activeLeftId && firstCat?.id) setActiveLeftId(firstCat.id);
    } else {
      const firstDept = (departments ?? [])[0];
      if (!activeLeftId && firstDept?.id) setActiveLeftId(firstDept.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkshop, categories?.length, departments?.length]);

  const doHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        utils.warehouses.listTop.invalidate(),
        utils.categories.list.invalidate(),
        utils.supplyUnits.listDepartments.invalidate(),
        isWorkshop
          ? utils.inventory.getByDepartment.invalidate()
          : utils.inventory.getByWarehouse.invalidate(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const leftItems = useMemo(() => {
    return isWorkshop ? (departments ?? []) : (categories ?? []);
  }, [isWorkshop, departments, categories]);

  const rightItems = useMemo(() => {
    const res = isWorkshop ? invByDeptQuery.data : invByWarehouseQuery.data;
    return res?.items ?? [];
  }, [isWorkshop, invByDeptQuery.data, invByWarehouseQuery.data]);

  const renderWarehouseTab = (w: TopWarehouse) => {
    const active = w.id === activeWarehouse?.id;
    return (
      <Pressable
        key={w.id}
        onPress={async () => {
          Keyboard.dismiss();
          await doHaptic();
          setActiveWarehouseId(w.id);
        }}
        className="mr-2 rounded-full border px-4 py-2"
        style={{
          borderColor: colors.border,
          backgroundColor: active ? colors.tint + "18" : "transparent",
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: active ? colors.tint : colors.text }}
        >
          {w.name}
        </Text>
      </Pressable>
    );
  };

  const renderLeftItem = ({ item }: { item: any }) => {
    const active = item.id === activeLeftId;
    return (
      <Pressable
        onPress={async () => {
          await doHaptic();
          setActiveLeftId(item.id);
        }}
        className="px-3 py-3 border-b"
        style={{
          borderBottomColor: colors.border,
          backgroundColor: active ? colors.tint + "12" : "transparent",
        }}
      >
        <Text
          numberOfLines={1}
          className="text-sm"
          style={{ color: active ? colors.tint : colors.text }}
        >
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const renderRightItem = ({ item }: { item: any }) => {
    return (
      <Pressable
        onPress={async () => {
          await doHaptic();
          // 材料流水页（允许空态）
          router.push({ pathname: "/materials/ledger", params: { id: String(item.material_id ?? item.materialId ?? item.id) } } as any);
        }}
        className="px-3 py-3 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {item.name || item.materialName || "-"}
            </Text>
            <Text className="text-xs text-muted mt-1" numberOfLines={1}>
              {item.code ? `编码：${item.code}` : ""}{item.spec ? `  |  规格：${item.spec}` : ""}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-bold text-foreground">{Number(item.quantity ?? 0).toFixed(2)}</Text>
            <Text className="text-xs text-muted mt-1">{item.unit || ""}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      {/* 标题 */}
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground">工作台</Text>
        <Text className="text-sm text-muted mt-1">五仓联动 · 结存与材料</Text>
      </View>

      {/* 顶部五仓 Tabs（固定在顶部，相当于 sticky） */}
      <View className="mt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
        >
          {(warehouses ?? []).map(renderWarehouseTab)}
          {warehousesLoading && (
            <View className="px-2 justify-center">
              <Text className="text-xs text-muted">加载中…</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 搜索 */}
      <View className="px-4 mt-3">
        <View
          className="flex-row items-center rounded-xl border px-3"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
        >
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索编码/名称/规格"
            placeholderTextColor={colors.muted}
            className="flex-1 px-2 py-3 text-sm text-foreground"
            returnKeyType="search"
          />
          {!!keyword && (
            <Pressable
              onPress={async () => {
                await doHaptic();
                setKeyword("");
              }}
              hitSlop={10}
            >
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 中部左右双栏联动 */}
      <View className="flex-1 mt-3 px-0">
        <View className="flex-1 flex-row">
          {/* 左栏 */}
          <View
            style={{ width: 120, borderRightColor: colors.border, borderRightWidth: 1 }}
            className="bg-background"
          >
            <View className="px-3 py-2 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-xs text-muted">{isWorkshop ? "部门" : "分类"}</Text>
            </View>
            <FlatList
              data={leftItems}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderLeftItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
              ListEmptyComponent={
                <View className="px-3 py-6">
                  <Text className="text-xs text-muted">暂无数据</Text>
                </View>
              }
            />
          </View>

          {/* 右栏 */}
          <View className="flex-1">
            <View className="px-3 py-2 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-xs text-muted">
                {isWorkshop ? "部门结存" : "仓库库存"}
              </Text>
            </View>
            <FlatList
              data={rightItems}
              keyExtractor={(it, idx) => String(it.material_id ?? it.materialId ?? it.id ?? idx)}
              renderItem={renderRightItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
              ListEmptyComponent={
                <View className="px-4 py-10 items-center">
                  <Text className="text-sm text-muted">暂无数据</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 92 }}
            />
          </View>
        </View>
      </View>

      {/* 底部两大按钮（固定） */}
      <View
        className="absolute left-0 right-0 px-4"
        style={{ bottom: 8 }}
      >
        <View
          className="flex-row gap-3 rounded-2xl p-3 border"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
        >
          <Pressable
            onPress={async () => {
              await doHaptic();
              router.push("/operations/bom-issue" as any);
            }}
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: colors.tint }}
          >
            <Text className="text-sm font-semibold" style={{ color: "white" }}>
              按BOM发料
            </Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await doHaptic();
              router.push("/operations/return-exchange" as any);
            }}
            className="flex-1 py-3 rounded-xl items-center border"
            style={{ borderColor: colors.border, backgroundColor: colors.card }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              退仓/换料/平账
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
