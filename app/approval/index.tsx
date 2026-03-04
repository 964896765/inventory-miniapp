import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api";

export default function ApprovalScreen() {
  const colors = useColors();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.approval.pending({});
    setItems(res.items || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const haptic = async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };

  const approve = async (docId: any) => {
    try {
      await haptic();
      await api.approval.approve(docId);
      Alert.alert("成功", "已审批通过");
      await load();
    } catch (e: any) {
      Alert.alert("提示", e?.message || "操作失败");
    }
  };

  const reject = async (docId: any) => {
    try {
      await haptic();
      await api.approval.reject(docId);
      Alert.alert("成功", "已驳回");
      await load();
    } catch (e: any) {
      Alert.alert("提示", e?.message || "操作失败");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground">待审批</Text>
        <Text className="text-sm text-muted mt-1">需要你处理的单据</Text>
      </View>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        renderItem={({ item }) => (
          <View className="mx-4 mb-3 bg-surface rounded-2xl border border-border p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">{item.docTypeText || item.docType}</Text>
              <Text className="text-xs text-muted">{item.docNo || ""}</Text>
            </View>
            <Text className="text-xs text-muted mt-2">提交人：{item.createdByName || item.createdBy || "-"}</Text>
            <View className="flex-row gap-3 mt-3">
              <Pressable className="flex-1 py-2 rounded-xl border border-border items-center"
                onPress={() => router.push(`/docs/${item.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-sm text-foreground">查看</Text>
              </Pressable>
              <Pressable className="flex-1 py-2 rounded-xl items-center"
                onPress={() => approve(item.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: colors.tint })}
              >
                <Text className="text-sm text-white">通过</Text>
              </Pressable>
              <Pressable className="flex-1 py-2 rounded-xl border border-border items-center"
                onPress={() => reject(item.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-sm" style={{ color: "#EF4444" }}>驳回</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-10"><Text className="text-sm text-muted">暂无待审批</Text></View>}
      />
    </ScreenContainer>
  );
}
