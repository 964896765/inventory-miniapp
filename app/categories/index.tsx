import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type Category = {
  id: number;
  name: string;
  parentId: number | null;
};

function indentName(node: Category, map: Map<number, Category>, depth = 0): string {
  // Prevent accidental cycles
  let d = 0;
  let cur = node;
  const seen = new Set<number>();
  while (cur.parentId != null && map.has(cur.parentId) && !seen.has(cur.parentId)) {
    seen.add(cur.parentId);
    cur = map.get(cur.parentId)!;
    d++;
    if (d > 20) break;
  }
  const prefix = d ? "  ".repeat(Math.min(d, 10)) + "· " : "";
  return prefix + node.name;
}

export default function CategoriesScreen() {
  const utils = trpc.useUtils();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<null | { id?: number; name: string; parentId?: number | null }>(null);

  const list = trpc.categories.list.useQuery(undefined, { staleTime: 0, refetchOnMount: "always" });

  const create = trpc.categories.create.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
      setEditing(null);
    },
  });
  const update = trpc.categories.update.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
      setEditing(null);
    },
  });
  const remove = trpc.categories.remove.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
    },
  });

  const items = useMemo(() => {
    const data = (list.data ?? []) as Category[];
    const keyword = q.trim();
    if (!keyword) return data;
    return data.filter((x) => (x.name ?? "").includes(keyword));
  }, [list.data, q]);

  const map = useMemo(() => {
    const m = new Map<number, Category>();
    (list.data ?? []).forEach((x: any) => m.set(Number(x.id), x));
    return m;
  }, [list.data]);

  const onSave = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return Alert.alert("提示", "分类名称不能为空");
    if (editing.id) {
      update.mutate({ id: editing.id, name, parentId: editing.parentId ?? null });
    } else {
      create.mutate({ name, parentId: editing.parentId ?? null });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "材料分类" }} />

      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="搜索分类"
            className="flex-1 border border-border rounded-xl px-3 py-2 text-foreground"
          />
          <Pressable
            onPress={() => setEditing({ name: "", parentId: null })}
            className="px-3 py-2 rounded-xl bg-primary"
          >
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
          <Text className="text-muted-foreground">暂无分类</Text>
        ) : (
          items
            .slice()
            .sort((a, b) => {
              // group by parentId then name
              const pa = a.parentId ?? 0;
              const pb = b.parentId ?? 0;
              if (pa !== pb) return pa - pb;
              return (a.name ?? "").localeCompare(b.name ?? "");
            })
            .map((x) => (
              <View key={x.id} className="border border-border rounded-2xl p-3">
                <Text className="text-base font-semibold text-foreground">{indentName(x, map)}</Text>
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => setEditing({ id: x.id, name: x.name ?? "", parentId: x.parentId ?? null })}
                    className="px-3 py-2 rounded-xl border border-border"
                  >
                    <Text className="text-sm text-foreground">编辑</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert("确认删除", `确定删除「${x.name}」吗？`, [
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

      {editing && (
        <View className="absolute inset-0 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl p-4 gap-3">
            <Text className="text-base font-semibold text-foreground">{editing.id ? "编辑分类" : "新增分类"}</Text>

            <TextInput
              value={editing.name}
              onChangeText={(v) => setEditing((s) => (s ? { ...s, name: v } : s))}
              placeholder="分类名称"
              className="border border-border rounded-xl px-3 py-2 text-foreground"
            />

            <Text className="text-xs text-muted-foreground">父级分类（可选）</Text>
            <ScrollView className="max-h-44 border border-border rounded-xl">
              <Pressable
                onPress={() => setEditing((s) => (s ? { ...s, parentId: null } : s))}
                className={cn("px-3 py-2", (editing.parentId ?? null) === null && "bg-muted")}
              >
                <Text className="text-sm text-foreground">无（顶级）</Text>
              </Pressable>
              {(list.data ?? [])
                .filter((c: any) => (editing.id ? Number(c.id) !== editing.id : true))
                .map((c: any) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setEditing((s) => (s ? { ...s, parentId: Number(c.id) } : s))}
                    className={cn("px-3 py-2", editing.parentId === Number(c.id) && "bg-muted")}
                  >
                    <Text className="text-sm text-foreground">{indentName(c, map)}</Text>
                  </Pressable>
                ))}
            </ScrollView>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setEditing(null)}
                className="flex-1 px-3 py-3 rounded-2xl border border-border items-center"
              >
                <Text className="text-sm text-foreground">取消</Text>
              </Pressable>
              <Pressable
                onPress={onSave}
                disabled={create.isPending || update.isPending}
                className="flex-1 px-3 py-3 rounded-2xl bg-primary items-center"
              >
                <Text className="text-sm text-primary-foreground">保存</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
