import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useDocDraft } from "@/lib/stores/doc-draft";

function WarehousePicker({
  title,
  value,
  onChange,
  excludeId,
}: {
  title: string;
  value: number | null;
  onChange: (id: number) => void;
  excludeId?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const q = trpc.warehouses.list.useQuery();
  const data = useMemo(
    () => (q.data ?? []).filter((w) => (excludeId ? w.id !== excludeId : true)),
    [q.data, excludeId]
  );
  const currentName = useMemo(() => {
    const item = (q.data ?? []).find((w) => w.id === value);
    return item?.name ?? `请选择${title}`;
  }, [q.data, value, title]);

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
            <Text className="text-lg font-semibold text-foreground">选择{title}</Text>
            <FlatList
              className="mt-3"
              data={data}
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
                </Pressable>
              )}
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

export default function TransferScreen() {
  const draft = useDocDraft();
  const submit = trpc.docs.submit.useMutation();
  const createDraft = trpc.docs.createDraft.useMutation();

  const onPickMaterials = () => {
    draft.setType("TRANSFER");
    router.push("/operations/select-materials" as any);
  };

  const onSubmit = async () => {
    if (!draft.warehouseId) {
      Alert.alert("提示", "请选择调出仓库");
      return;
    }
    if (!draft.targetWarehouseId) {
      Alert.alert("提示", "请选择调入仓库");
      return;
    }
    if (draft.warehouseId === draft.targetWarehouseId) {
      Alert.alert("提示", "调入仓库不能与调出仓库相同");
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
        docType: "TRANSFER",
        fromWarehouseId: draft.warehouseId,
        toWarehouseId: draft.targetWarehouseId,
        departmentId: null,
        remark: draft.remark || null,
        items: draft.lines.map((l) => ({
          material_id: l.materialId,
          quantity: l.quantity,
          price: null,
        })),
      });
      await submit.mutateAsync({ id: res.id });
      Alert.alert("成功", "已生成调拨单并更新库存");
      draft.reset("TRANSFER");
      router.replace("/docs" as any);
    } catch (e: any) {
      Alert.alert("提交失败", e?.message ?? String(e));
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="p-4 gap-4">
        <View className="bg-white border border-gray-200 rounded-2xl p-4 gap-3">
          <Text className="text-lg font-semibold text-gray-900">调拨</Text>
          <Text className="text-sm text-gray-500">调出仓库</Text>
          <WarehousePicker
            title="调出仓库"
            value={draft.warehouseId}
            onChange={(id) => {
              draft.setWarehouseId(id);
              if (draft.targetWarehouseId === id) draft.setTargetWarehouseId(null);
            }}
          />

          <Text className="text-sm text-gray-500 mt-2">调入仓库</Text>
          <WarehousePicker
            title="调入仓库"
            value={draft.targetWarehouseId}
            excludeId={draft.warehouseId}
            onChange={(id) => draft.setTargetWarehouseId(id)}
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
                <View key={l.materialId} className="border border-gray-200 rounded-xl p-3">
                  <Text className="text-gray-900 font-medium">{l.name}</Text>
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
          <Text className="text-white font-semibold text-base">提交调拨</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
