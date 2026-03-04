import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useDocDraft } from "@/lib/stores/doc-draft";

function WarehousePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const q = trpc.warehouses.list.useQuery();

  const currentName = useMemo(() => {
    const item = q.data?.find((w) => w.id === value);
    return item?.name ?? "请选择仓库";
  }, [q.data, value]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-white border border-gray-200 rounded-xl px-3 py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="text-gray-900">{currentName}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <ScreenContainer className="bg-background">
          <View className="p-4">
            <Text className="text-lg font-semibold text-foreground">选择仓库</Text>
            <FlatList
              className="mt-3"
              data={q.data ?? []}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-3 mb-2"
                >
                  <Text className="text-gray-900 font-medium">{item.name}</Text>
                  {!!item.location && (
                    <Text className="text-gray-500 text-xs mt-1">{item.location}</Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="text-gray-500 mt-6">暂无仓库，请先到【基础资料-仓库管理】创建</Text>
              }
            />
            <Pressable
              onPress={() => setOpen(false)}
              className="mt-3 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-900 font-semibold">关闭</Text>
            </Pressable>
          </View>
        </ScreenContainer>
      </Modal>
    </>
  );
}

export default function StockInScreen() {
  const draft = useDocDraft();

  useFocusEffect(
    useMemo(
      () => () => {
        // no-op
      },
      []
    )
  );

  const submit = trpc.docs.submit.useMutation();
  const createDraft = trpc.docs.createDraft.useMutation();

  const onPickMaterials = () => {
    draft.setType("IN");
    router.push("/operations/select-materials" as any);
  };

  const onSubmit = async () => {
    if (!draft.warehouseId) {
      Alert.alert("提示", "请选择入库仓库");
      return;
    }
    if (!draft.lines.length) {
      Alert.alert("提示", "请选择物料");
      return;
    }
    if (draft.lines.some((l) => !l.quantity || l.quantity <= 0)) {
      Alert.alert("提示", "请填写每行数量（>0）");
      return;
    }

    try {
      const res = await createDraft.mutateAsync({
        docType: "IN",
        fromWarehouseId: null,
        toWarehouseId: draft.warehouseId,
        departmentId: null,
        remark: draft.remark || null,
        items: draft.lines.map((l) => ({
          material_id: l.materialId,
          quantity: l.quantity,
          price: null,
        })),
      });

      await submit.mutateAsync({ id: res.id });
      Alert.alert("成功", "已生成入库单并入账");
      draft.reset("IN");
      router.replace("/docs" as any);
    } catch (e: any) {
      Alert.alert("提交失败", e?.message ?? String(e));
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="p-4 gap-4">
        <View className="bg-white border border-gray-200 rounded-2xl p-4 gap-3">
          <Text className="text-lg font-semibold text-gray-900">入库</Text>

          <Text className="text-sm text-gray-500">入库仓库</Text>
          <WarehousePicker
            value={draft.warehouseId}
            onChange={(id) => draft.setWarehouseId(id)}
          />

          <Text className="text-sm text-gray-500 mt-2">备注</Text>
          <TextInput
            value={draft.remark}
            onChangeText={draft.setRemark}
            placeholder="可选"
            className="bg-white border border-gray-200 rounded-xl px-3 py-3"
          />
        </View>

        <View className="bg-white border border-gray-200 rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">物料明细</Text>
            <Pressable
              onPress={onPickMaterials}
              className="bg-primary rounded-xl px-3 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-white font-semibold">选择物料</Text>
            </Pressable>
          </View>

          {draft.lines.length === 0 ? (
            <Text className="text-gray-500 mt-4">未选择</Text>
          ) : (
            <View className="mt-3 gap-3">
              {draft.lines.map((l) => (
                <View
                  key={l.materialId}
                  className="border border-gray-200 rounded-xl p-3"
                >
                  <Text className="text-gray-900 font-medium">{l.name}</Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {l.sku ? `编码：${l.sku}  ` : ""}
                    {l.unit ? `单位：${l.unit}` : ""}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-gray-500">数量</Text>
                    <TextInput
                      value={String(l.quantity ?? "")}
                      onChangeText={(v) =>
                        draft.upsertLineQty(l.materialId, Number(v || 0))
                      }
                      keyboardType="numeric"
                      className="min-w-[120px] text-right px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          onPress={onSubmit}
          className="bg-primary rounded-2xl py-4 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-white font-semibold text-base">提交入库</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
