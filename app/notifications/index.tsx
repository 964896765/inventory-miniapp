import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

export default function NotificationsScreen() {
  const colors = useColors();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.notifications.list({});
    setItems(res.items || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const haptic = async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };

  const open = async (item: any) => {
    await haptic();
    if (!item.isRead) {
      await api.notifications.markRead([item.id]);
      await load();
    }
    if (item.relatedDocId) router.push(`/docs/${item.relatedDocId}`);
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground">消息通知</Text>
        <Text className="text-sm text-muted mt-1">审批/预警/系统消息</Text>
      </View>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            className="mx-4 mb-3 bg-surface rounded-2xl border border-border p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">{item.title}</Text>
              {!item.isRead && <View className="w-2 h-2 rounded-full bg-error" />}
            </View>
            <Text className="text-xs text-muted mt-2">{item.content}</Text>
            <Text className="text-[11px] text-muted mt-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<View className="items-center py-10"><Text className="text-sm text-muted">暂无通知</Text></View>}
      />
    </ScreenContainer>
  );
}
