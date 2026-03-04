import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api";

export default function InventoryScreen() {
  const colors = useColors();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.inventory.getList({});
    setItems(Array.isArray(res) ? res : (res.items || []));
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  return (
    <ScreenContainer className="bg-background">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground">库存查询</Text>
        <Text className="text-sm text-muted mt-1">按仓库/材料/批次查询</Text>
      </View>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(it, idx) => String(it.id ?? idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        renderItem={({ item }) => (
          <View className="mx-4 mb-3 bg-surface rounded-2xl border border-border p-4">
            <Text className="text-sm font-semibold text-foreground">{item.materialName || item.materialId}</Text>
            <Text className="text-xs text-muted mt-1">仓库：{item.warehouseName || item.warehouseId}  批次：{item.batchNo || "-"}</Text>
            <Text className="text-xs text-muted mt-1">数量：{item.quantity ?? item.balance ?? 0}</Text>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-10"><Text className="text-sm text-muted">暂无库存数据</Text></View>}
      />
    </ScreenContainer>
  );
}
