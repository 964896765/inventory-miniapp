import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface BOMItem {
  id: string;
  materialId?: number;
  materialName: string;
  quantity: string;
  unit: string;
}

/**
 * BOM新增/编辑页面
 * 
 * 功能：
 * - 新增BOM
 * - 编辑BOM信息
 * - 添加/编辑/删除材料清单
 */
export default function AddBOMScreen() {
  const params = useLocalSearchParams();
  const bomId = params.id ? Number(params.id) : null;
  const isEdit = bomId !== null;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    notes: "",
  });
  const [items, setItems] = useState<BOMItem[]>([
    { id: "1", materialName: "", quantity: "", unit: "" },
  ]);
  const [loading, setLoading] = useState(false);

  // 加载BOM信息（编辑模式）
  useEffect(() => {
    if (isEdit) {
      const loadBOM = async () => {
        try {
          // TODO: 调用API获取BOM信息
          // const response = await api.get(`/api/boms/${bomId}`);
          // setFormData(response.data);
          // setItems(response.data.items);
          
          // 模拟数据
          setFormData({
            name: "大哥大电池组装",
            code: "BOM-001",
            notes: "标准组装流程",
          });
          setItems([
            {
              id: "1",
              materialId: 1,
              materialName: "大哥大电池",
              quantity: "1",
              unit: "个",
            },
            {
              id: "2",
              materialId: 2,
              materialName: "隔膜",
              quantity: "2",
              unit: "米",
            },
          ]);
        } catch (error) {
          console.error("加载BOM信息失败:", error);
          Alert.alert("错误", "加载BOM信息失败");
        }
      };
      loadBOM();
    }
  }, [isEdit, bomId]);

  // 更新表单字段
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 添加材料行
  const addItem = () => {
    const newId = String(Date.now());
    setItems([...items, { id: newId, materialName: "", quantity: "", unit: "" }]);
  };

  // 删除材料行
  const removeItem = (id: string) => {
    if (items.length === 1) {
      Alert.alert("提示", "至少保留一个材料");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // 更新材料行
  const updateItem = (id: string, field: keyof BOMItem, value: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // 选择材料
  const selectMaterial = (id: string) => {
    // TODO: 打开材料选择器
    Alert.alert("选择材料", "材料选择器开发中...", [
      { text: "取消", style: "cancel" },
      {
        text: "大哥大电池",
        onPress: () => {
          updateItem(id, "materialName", "大哥大电池");
          updateItem(id, "unit", "个");
        },
      },
      {
        text: "隔膜",
        onPress: () => {
          updateItem(id, "materialName", "隔膜");
          updateItem(id, "unit", "米");
        },
      },
    ]);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      Alert.alert("提示", "请输入BOM名称");
      return;
    }
    if (!formData.code.trim()) {
      Alert.alert("提示", "请输入BOM编号");
      return;
    }

    // 验证材料清单
    const invalidItems = items.filter(
      (item) => !item.materialName || !item.quantity
    );
    if (invalidItems.length > 0) {
      Alert.alert("提示", "请完善材料清单信息");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API创建/更新BOM
      // const payload = { ...formData, items };
      // if (isEdit) {
      //   await api.put(`/api/boms/${bomId}`, payload);
      // } else {
      //   await api.post('/api/boms', payload);
      // }
      
      Alert.alert("成功", `BOM已${isEdit ? "更新" : "创建"}`, [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error(`${isEdit ? "更新" : "创建"}BOM失败:`, error);
      Alert.alert("错误", `${isEdit ? "更新" : "创建"}BOM失败`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      {/* 顶部导航栏 */}
      <View className="bg-primary px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">
          {isEdit ? "编辑BOM" : "新增BOM"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* BOM名称 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">
            BOM名称 <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请输入BOM名称"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            autoFocus
          />
        </View>

        {/* BOM编号 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">
            BOM编号 <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请输入BOM编号"
            placeholderTextColor="#9CA3AF"
            value={formData.code}
            onChangeText={(value) => updateField("code", value)}
          />
        </View>

        {/* 材料清单 */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-foreground">
              材料清单 <Text className="text-error">*</Text>
            </Text>
            <Pressable
              onPress={addItem}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-primary text-sm">+ 添加材料</Text>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View
              key={item.id}
              className="bg-surface border border-border rounded-xl p-3 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-muted">材料 {index + 1}</Text>
                {items.length > 1 && (
                  <Pressable
                    onPress={() => removeItem(item.id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-error text-xs">删除</Text>
                  </Pressable>
                )}
              </View>

              {/* 材料名称 */}
              <Pressable
                onPress={() => selectMaterial(item.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="bg-background border border-border rounded-lg px-3 py-2 mb-2 flex-row items-center justify-between">
                  <Text
                    className={`text-sm ${
                      item.materialName ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {item.materialName || "选择材料"}
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
                </View>
              </Pressable>

              {/* 数量和单位 */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <TextInput
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="数量"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={item.quantity}
                    onChangeText={(value) =>
                      updateItem(item.id, "quantity", value)
                    }
                  />
                </View>
                <View className="w-20">
                  <TextInput
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="单位"
                    placeholderTextColor="#9CA3AF"
                    value={item.unit}
                    onChangeText={(value) => updateItem(item.id, "unit", value)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 备注 */}
        <View className="mb-6">
          <Text className="text-sm text-foreground mb-2">备注</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请填写备注信息"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={formData.notes}
            onChangeText={(value) => updateField("notes", value)}
          />
        </View>

        {/* 提交按钮 */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => ({
            opacity: pressed || loading ? 0.7 : 1,
          })}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              {loading ? "提交中..." : "提交"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
