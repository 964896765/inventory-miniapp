import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { trpc } from "@/lib/trpc";

export default function BomDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id ?? 0);
  const utils = trpc.useUtils();

  const bom = trpc.boms.get.useQuery({ id }, { enabled: Number.isFinite(id) && id > 0 });
  const remove = trpc.boms.remove.useMutation({
    onSuccess: async () => {
      await utils.boms.list.invalidate();
      router.back();
    },
  });

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "BOM 详情" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3">
        {bom.isLoading ? (
          <Text className="text-muted-foreground">加载中...</Text>
        ) : bom.isError ? (
          <Text className="text-destructive">加载失败：{String(bom.error.message ?? bom.error)}</Text>
        ) : !bom.data ? (
          <Text className="text-muted-foreground">未找到 BOM</Text>
        ) : (
          <>
            <View className="border border-border rounded-2xl p-4">
              <Text className="text-lg font-semibold text-foreground">{bom.data.code}</Text>
              <Text className="text-base text-foreground mt-1">{bom.data.name}</Text>
              <Text className="text-xs text-muted-foreground mt-2">
                创建时间：{bom.data.createdAt ? new Date(bom.data.createdAt).toLocaleString() : "-"}
              </Text>
            </View>

            <View className="border border-border rounded-2xl p-4">
              <Text className="text-base font-semibold text-foreground">物料清单</Text>
              {(bom.data.items ?? []).length === 0 ? (
                <Text className="text-sm text-muted-foreground mt-2">暂无物料条目</Text>
              ) : (
                (bom.data.items ?? []).map((it: any) => (
                  <View key={it.id} className="mt-3 flex-row justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm text-foreground">{it.materialName ?? it.materialCode ?? `物料#${it.materialId}`}</Text>
                      {it.materialCode && <Text className="text-xs text-muted-foreground">{it.materialCode}</Text>}
                    </View>
                    <Text className="text-sm text-foreground">{it.qty}</Text>
                  </View>
                ))
              )}
            </View>

            <Pressable
              onPress={() =>
                Alert.alert("确认删除", `确定删除该 BOM 吗？`, [
                  { text: "取消", style: "cancel" },
                  { text: "删除", style: "destructive", onPress: () => remove.mutate({ id }) },
                ])
              }
              className="px-4 py-3 rounded-2xl border border-destructive items-center"
            >
              <Text className="text-sm text-destructive">删除 BOM</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
