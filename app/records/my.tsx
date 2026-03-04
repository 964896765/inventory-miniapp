import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export default function MyRecordsScreen() {
  const colors = useColors();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.docs.list({ mine: 1 });
    setItems(res.items || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const haptic = async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };

  return (
    <ScreenContainer className="bg-background">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground">我的记录</Text>
        <Text className="text-sm text-muted mt-1">我创建/操作过的单据</Text>
      </View>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={async () => { await haptic(); router.push(`/docs/${item.id}`); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            className="mx-4 mb-3 bg-surface rounded-2xl border border-border p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">{item.docTypeText || item.docType}</Text>
              <Text className="text-xs text-muted">{item.status}</Text>
            </View>
            <Text className="text-xs text-muted mt-1">{item.docNo || ""}</Text>
            <Text className="text-[11px] text-muted mt-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<View className="items-center py-10"><Text className="text-sm text-muted">暂无记录</Text></View>}
      />
    </ScreenContainer>
  );
}
