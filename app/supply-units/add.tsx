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

type UnitType = "customer" | "supplier" | "other";

/**
 * 供需单位新增/编辑页面
 * 
 * 功能：
 * - 新增单位
 * - 编辑单位信息
 */
export default function AddSupplyUnitScreen() {
  const params = useLocalSearchParams();
  const unitId = params.id ? Number(params.id) : null;
  const unitType = (params.type as UnitType) || "customer";
  const isEdit = unitId !== null;

  const [formData, setFormData] = useState({
    name: "",
    type: unitType,
    contact: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // 加载单位信息（编辑模式）
  useEffect(() => {
    if (isEdit) {
      const loadUnit = async () => {
        try {
          // TODO: 调用API获取单位信息
          // const response = await api.get(`/api/supply-units/${unitId}`);
          // setFormData(response.data);
          
          // 模拟数据
          setFormData({
            name: "生产部",
            type: "customer",
            contact: "张三",
            phone: "13800138001",
            address: "",
            notes: "",
          });
        } catch (error) {
          console.error("加载单位信息失败:", error);
          Alert.alert("错误", "加载单位信息失败");
        }
      };
      loadUnit();
    }
  }, [isEdit, unitId]);

  // 更新表单字段
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      Alert.alert("提示", "请输入单位名称");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API创建/更新单位
      // if (isEdit) {
      //   await api.put(`/api/supply-units/${unitId}`, formData);
      // } else {
      //   await api.post('/api/supply-units', formData);
      // }
      
      Alert.alert("成功", `单位已${isEdit ? "更新" : "创建"}`, [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error(`${isEdit ? "更新" : "创建"}单位失败:`, error);
      Alert.alert("错误", `${isEdit ? "更新" : "创建"}单位失败`);
    } finally {
      setLoading(false);
    }
  };

  // 获取类型标签
  const getTypeLabel = (type: UnitType) => {
    const labels = {
      customer: "部门",
      supplier: "供应商",
      other: "其它",
    };
    return labels[type];
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
          {isEdit ? "编辑单位" : `新增${getTypeLabel(unitType)}`}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* 单位名称 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">
            单位名称 <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请输入单位名称"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            autoFocus
          />
        </View>

        {/* 联系人 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">联系人</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请输入联系人姓名"
            placeholderTextColor="#9CA3AF"
            value={formData.contact}
            onChangeText={(value) => updateField("contact", value)}
          />
        </View>

        {/* 联系电话 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">联系电话</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请输入联系电话"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => updateField("phone", value)}
          />
        </View>

        {/* 地址 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">地址</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            placeholder="请输入地址"
            placeholderTextColor="#9CA3AF"
            value={formData.address}
            onChangeText={(value) => updateField("address", value)}
          />
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
