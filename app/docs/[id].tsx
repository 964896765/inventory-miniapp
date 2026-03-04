import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { api } from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

export default function DocDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<any>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.docs.getDetail(id);
    setDoc(res);
  }, [id]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const haptic = async () => { try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };

  const submit = async () => {
    try {
      await haptic();
      await api.docs.submit(id);
      Alert.alert("成功", "已提交");
      await load();
    } catch (e: any) {
      Alert.alert("提示", e?.message || "提交失败");
    }
  };

  const post = async () => {
    try {
      await haptic();
      await api.docs.post(id);
      Alert.alert("成功", "已过账");
      await load();
    } catch (e: any) {
      Alert.alert("提示", e?.message || "过账失败");
    }
  };

  if (!doc) {
    return (
      <ScreenContainer className="bg-background">
        <View className="px-4 pt-10 items-center">
          <Text className="text-sm text-muted">加载中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-foreground">{doc.docTypeText || doc.docType}单</Text>
          <Text className="text-xs text-muted">{doc.status}</Text>
        </View>
        <Text className="text-xs text-muted mt-2">{doc.docNo || ""}</Text>

        <View className="mt-4 bg-surface rounded-2xl border border-border p-4">
          <Text className="text-sm font-semibold text-foreground mb-2">明细</Text>
          {(doc.items || []).map((it: any, idx: number) => (
            <View key={idx} className="py-2 border-b border-border">
              <Text className="text-sm text-foreground">{it.materialName || it.materialId}</Text>
              <Text className="text-xs text-muted mt-1">数量：{it.quantity}  批次：{it.batchNo || "-"}</Text>
            </View>
          ))}
          {(!doc.items || doc.items.length === 0) && <Text className="text-sm text-muted">暂无明细</Text>}
        </View>

        <View className="flex-row gap-3 mt-4">
          <Pressable onPress={async () => { await haptic(); router.back(); }}
            className="flex-1 py-3 rounded-2xl border border-border items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-sm text-foreground">返回</Text>
          </Pressable>

          <Pressable onPress={submit}
            className="flex-1 py-3 rounded-2xl items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: "#5B7FC7" })}
          >
            <Text className="text-sm text-white">提交</Text>
          </Pressable>

          <Pressable onPress={post}
            className="flex-1 py-3 rounded-2xl border border-border items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-sm text-foreground">过账</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
