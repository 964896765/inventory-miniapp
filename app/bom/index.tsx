import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { trpc } from "@/lib/trpc";

export default function BomListScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState<null | { code: string; name: string }>(null);

  const list = trpc.boms.list.useQuery(undefined, { staleTime: 0, refetchOnMount: "always" });
  const create = trpc.boms.create.useMutation({
    onSuccess: async (res) => {
      await utils.boms.list.invalidate();
      setCreating(null);
      router.push({ pathname: "/bom/detail", params: { id: String(res.id) } });
    },
  });
  const remove = trpc.boms.remove.useMutation({
    onSuccess: async () => {
      await utils.boms.list.invalidate();
    },
  });

  const items = useMemo(() => {
    const data = list.data ?? [];
    const keyword = q.trim();
    if (!keyword) return data;
    return data.filter((x) => (x.code ?? "").includes(keyword) || (x.name ?? "").includes(keyword));
  }, [list.data, q]);

  const onSave = () => {
    if (!creating) return;
    const code = creating.code.trim();
    const name = creating.name.trim();
    if (!code || !name) return Alert.alert("提示", "编码和名称不能为空");
    create.mutate({ code, name, items: [] });
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "BOM 管理" }} />

      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="搜索 BOM（编码/名称）"
            className="flex-1 border border-border rounded-xl px-3 py-2 text-foreground"
          />
          <Pressable onPress={() => setCreating({ code: "", name: "" })} className="px-3 py-2 rounded-xl bg-primary">
            <Text className="text-sm text-primary-foreground">新增</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3">
        {list.isLoading ? (
          <Text className="text-muted-foreground">加载中...</Text>
        ) : list.isError ? (
          <Text className="text-destructive">加载失败：{String(list.error.message ?? list.error)}</Text>
        ) : items.length === 0 ? (
          <Text className="text-muted-foreground">暂无 BOM</Text>
        ) : (
          items
            .slice()
            .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
            .map((x) => (
              <View key={x.id} className="border border-border rounded-2xl p-3">
                <Pressable onPress={() => router.push({ pathname: "/bom/detail", params: { id: String(x.id) } })}>
                  <Text className="text-base font-semibold text-foreground">{x.code} · {x.name}</Text>
                </Pressable>
                <Text className="text-xs text-muted-foreground mt-1">创建时间：{x.createdAt ? new Date(x.createdAt).toLocaleString() : "-"}</Text>
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => router.push({ pathname: "/bom/detail", params: { id: String(x.id) } })}
                    className="px-3 py-2 rounded-xl border border-border"
                  >
                    <Text className="text-sm text-foreground">详情</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert("确认删除", `确定删除「${x.code} ${x.name}」吗？`, [
                        { text: "取消", style: "cancel" },
                        { text: "删除", style: "destructive", onPress: () => remove.mutate({ id: x.id }) },
                      ])
                    }
                    className="px-3 py-2 rounded-xl border border-destructive"
                  >
                    <Text className="text-sm text-destructive">删除</Text>
                  </Pressable>
                </View>
              </View>
            ))
        )}
      </ScrollView>

      {creating && (
        <View className="absolute inset-0 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl p-4 gap-3">
            <Text className="text-base font-semibold text-foreground">新增 BOM</Text>
            <TextInput
              value={creating.code}
              onChangeText={(v) => setCreating((s) => (s ? { ...s, code: v } : s))}
              placeholder="BOM 编码"
              className="border border-border rounded-xl px-3 py-2 text-foreground"
            />
            <TextInput
              value={creating.name}
              onChangeText={(v) => setCreating((s) => (s ? { ...s, name: v } : s))}
              placeholder="BOM 名称"
              className="border border-border rounded-xl px-3 py-2 text-foreground"
            />

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setCreating(null)}
                className="flex-1 px-3 py-3 rounded-2xl border border-border items-center"
              >
                <Text className="text-sm text-foreground">取消</Text>
              </Pressable>
              <Pressable
                onPress={onSave}
                disabled={create.isPending}
                className="flex-1 px-3 py-3 rounded-2xl bg-primary items-center"
              >
                <Text className="text-sm text-primary-foreground">创建</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
