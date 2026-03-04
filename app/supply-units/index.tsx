import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type SupplyUnitType = "supplier" | "customer" | "department";

const TABS: { key: SupplyUnitType; label: string }[] = [
  { key: "supplier", label: "供应商" },
  { key: "customer", label: "客户" },
  { key: "department", label: "部门" },
];

export default function SupplyUnitsScreen() {
  const [tab, setTab] = useState<SupplyUnitType>("supplier");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<null | { id?: number; name: string; contact?: string; phone?: string }>(
    null
  );

  const utils = trpc.useUtils();
  const list = trpc.supplyUnits.list.useQuery(
    { type: tab },
    { staleTime: 0, refetchOnMount: "always" }
  );

  const create = trpc.supplyUnits.create.useMutation({
    onSuccess: async () => {
      await utils.supplyUnits.list.invalidate({ type: tab });
      setEditing(null);
    },
  });
  const update = trpc.supplyUnits.update.useMutation({
    onSuccess: async () => {
      await utils.supplyUnits.list.invalidate({ type: tab });
      setEditing(null);
    },
  });
  const remove = trpc.supplyUnits.remove.useMutation({
    onSuccess: async () => {
      await utils.supplyUnits.list.invalidate({ type: tab });
    },
  });

  const items = useMemo(() => {
    const data = list.data ?? [];
    const keyword = q.trim();
    if (!keyword) return data;
    return data.filter((x) => (x.name ?? "").includes(keyword));
  }, [list.data, q]);

  const onSave = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return Alert.alert("提示", "名称不能为空");
    if (editing.id) {
      update.mutate({
        id: editing.id,
        name,
        contact: editing.contact,
        phone: editing.phone,
      });
    } else {
      create.mutate({
        type: tab,
        name,
        contact: editing.contact,
        phone: editing.phone,
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "供需单位" }} />

      <View className="px-4 pt-3">
        <View className="flex-row gap-2">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className={cn(
                "px-3 py-2 rounded-full border",
                tab === t.key ? "bg-primary border-primary" : "border-border"
              )}
            >
              <Text className={cn("text-sm", tab === t.key ? "text-primary-foreground" : "text-foreground")}>
                {t.label}
              </Text>
            </Pressable>
          ))}
          <View className="flex-1" />
          <Pressable
            onPress={() => setEditing({ name: "" })}
            className="px-3 py-2 rounded-full bg-primary"
          >
            <Text className="text-sm text-primary-foreground">新增</Text>
          </Pressable>
        </View>

        <View className="mt-3">
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="搜索名称"
            className="border border-border rounded-xl px-3 py-2 text-foreground"
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3">
        {list.isLoading ? (
          <Text className="text-muted-foreground">加载中...</Text>
        ) : list.isError ? (
          <Text className="text-destructive">加载失败：{String(list.error.message ?? list.error)}</Text>
        ) : items.length === 0 ? (
          <Text className="text-muted-foreground">暂无数据</Text>
        ) : (
          items.map((x) => (
            <View key={x.id} className="border border-border rounded-2xl p-3">
              <Text className="text-base font-semibold text-foreground">{x.name}</Text>
              {(x.contact || x.phone) && (
                <Text className="text-xs text-muted-foreground mt-1">
                  {x.contact ? `联系人：${x.contact}` : ""}
                  {x.contact && x.phone ? "  ·  " : ""}
                  {x.phone ? `电话：${x.phone}` : ""}
                </Text>
              )}
              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => setEditing({ id: x.id, name: x.name ?? "", contact: x.contact ?? undefined, phone: x.phone ?? undefined })}
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
            <Text className="text-base font-semibold text-foreground">
              {editing.id ? "编辑" : "新增"}{TABS.find((t) => t.key === tab)?.label}
            </Text>

            <TextInput
              value={editing.name}
              onChangeText={(v) => setEditing((s) => (s ? { ...s, name: v } : s))}
              placeholder="名称"
              className="border border-border rounded-xl px-3 py-2 text-foreground"
            />
            <TextInput
              value={editing.contact ?? ""}
              onChangeText={(v) => setEditing((s) => (s ? { ...s, contact: v } : s))}
              placeholder="联系人（可选）"
              className="border border-border rounded-xl px-3 py-2 text-foreground"
            />
            <TextInput
              value={editing.phone ?? ""}
              onChangeText={(v) => setEditing((s) => (s ? { ...s, phone: v } : s))}
              placeholder="电话（可选）"
              className="border border-border rounded-xl px-3 py-2 text-foreground"
              keyboardType="phone-pad"
            />

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
