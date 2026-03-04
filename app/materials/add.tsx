import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as ImagePicker from "expo-image-picker";
import { DatePicker } from "@/components/DatePicker";

/**
 * 材料新增/编辑页面
 * 
 * 采用单行布局（标签在左，输入框在右）
 * 字段：
 * 1. 材料名称*（必填）
 * 2. 材料分类*（选择器）
 * 3. 材料单位*（选择器，跳转单位编辑页）
 * 4. 规格名称
 * 5. 材料图片（上传）
 * 6. 条码/二维码（扫码/手动输入）
 * 7. 价格（统一价格，不分入库/出库）
 * 8. 库存预警
 * 9. 有效期（日期选择器）
 * 10. 备注
 */
export default function AddMaterialScreen() {
  const params = useLocalSearchParams();
  const materialId = params.id ? Number(params.id) : null;
  const isEdit = materialId !== null;

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "",
    specs: "",
    image: "",
    barcode: "",
    price: "",
    warningLevel: "",
    expiryDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 更新表单字段
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 选择图片
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateField("image", result.assets[0].uri);
    }
  };

  // 扫描条码
  const scanBarcode = () => {
    // TODO: 实现条码扫描功能
    Alert.alert("提示", "条码扫描功能开发中...");
  };

  // 选择分类
  const selectCategory = () => {
    // TODO: 跳转到分类选择页面
    router.push("/categories" as any);
  };

  // 选择单位（跳转到单位编辑页）
  const selectUnit = () => {
    router.push("/units" as any);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      Alert.alert("提示", "请输入材料名称");
      return;
    }
    if (!formData.category) {
      Alert.alert("提示", "请选择材料分类");
      return;
    }
    if (!formData.unit) {
      Alert.alert("提示", "请选择材料单位");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API创建/更新材料
      
      Alert.alert("成功", `材料已${isEdit ? "更新" : "创建"}`, [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error(`${isEdit ? "更新" : "创建"}材料失败:`, error);
      Alert.alert("错误", `${isEdit ? "更新" : "创建"}材料失败`);
    } finally {
      setLoading(false);
    }
  };

  // 表单行组件（单行布局）
  const FormRow = ({
    label,
    required,
    children,
  }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <View className="flex-row items-center py-3 border-b border-border">
      <Text className="text-sm text-foreground w-24">
        {label}
        {required && <Text className="text-error"> *</Text>}
      </Text>
      <View className="flex-1">{children}</View>
    </View>
  );

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
          {isEdit ? "编辑材料" : "添加新材料"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* 材料名称 */}
        <FormRow label="材料名称" required>
          <TextInput
            className="flex-1 text-base text-foreground text-right"
            placeholder="请输入材料名称"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
          />
        </FormRow>

        {/* 材料分类 */}
        <FormRow label="材料分类" required>
          <Pressable
            onPress={selectCategory}
            className="flex-1 flex-row items-center justify-end"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text
              className={`text-base ${
                formData.category ? "text-foreground" : "text-muted"
              }`}
            >
              {formData.category || "请选择材料分类"}
            </Text>
            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" style={{ marginLeft: 8 }} />
          </Pressable>
        </FormRow>

        {/* 材料单位 */}
        <FormRow label="材料单位" required>
          <View className="flex-1 flex-row items-center justify-between">
            <Text
              className={`text-base ${
                formData.unit ? "text-foreground" : "text-muted"
              }`}
            >
              {formData.unit || "材料单位，如：个、件、台"}
            </Text>
            <Pressable
              onPress={selectUnit}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-primary text-sm">选择</Text>
            </Pressable>
          </View>
        </FormRow>

        {/* 规格名称 */}
        <FormRow label="规格名称">
          <TextInput
            className="flex-1 text-base text-foreground text-right"
            placeholder="请输入商品规格"
            placeholderTextColor="#9CA3AF"
            value={formData.specs}
            onChangeText={(value) => updateField("specs", value)}
          />
        </FormRow>

        {/* 材料图片 */}
        <FormRow label="材料图片">
          <Pressable
            onPress={pickImage}
            className="flex-1 flex-row items-center justify-end"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {formData.image ? (
              <Image
                source={{ uri: formData.image }}
                style={{ width: 40, height: 40, borderRadius: 8 }}
              />
            ) : (
              <Text className="text-base text-muted">点击上传图片</Text>
            )}
            <Text className="text-primary text-sm ml-2">选择</Text>
          </Pressable>
        </FormRow>

        {/* 条码/二维码 */}
        <FormRow label="条码/二维码">
          <View className="flex-1 flex-row items-center justify-end gap-2">
            <TextInput
              className="flex-1 text-base text-foreground text-right"
              placeholder="留空会自动生成"
              placeholderTextColor="#9CA3AF"
              value={formData.barcode}
              onChangeText={(value) => updateField("barcode", value)}
            />
            <Pressable
              onPress={scanBarcode}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="bg-primary rounded-lg px-3 py-1">
                <Text className="text-white text-sm">扫码</Text>
              </View>
            </Pressable>
          </View>
        </FormRow>

        {/* 价格 */}
        <FormRow label="价格">
          <TextInput
            className="flex-1 text-base text-foreground text-right"
            placeholder="请输入价格"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={formData.price}
            onChangeText={(value) => updateField("price", value)}
          />
        </FormRow>

        {/* 库存预警 */}
        <FormRow label="库存预警">
          <TextInput
            className="flex-1 text-base text-foreground text-right"
            placeholder="请输入最低库存数量"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.warningLevel}
            onChangeText={(value) => updateField("warningLevel", value)}
          />
        </FormRow>

        {/* 有效期 */}
        <FormRow label="有效期">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-1 flex-row items-center justify-end"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text
              className={`text-base ${
                formData.expiryDate ? "text-foreground" : "text-muted"
              }`}
            >
              {formData.expiryDate || "请输入商品有效期到期时间"}
            </Text>
          </Pressable>
        </FormRow>

        {/* 备注 */}
        <FormRow label="备注">
          <TextInput
            className="flex-1 text-base text-foreground text-right"
            placeholder="请填写备注，如：货架号、自定义信息"
            placeholderTextColor="#9CA3AF"
            value={formData.notes}
            onChangeText={(value) => updateField("notes", value)}
            multiline
          />
        </FormRow>

        {/* 提交按钮 */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
          className="mt-8"
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              {loading ? "提交中..." : "提交"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* 日期选择器弹窗 */}
      <DatePicker
        visible={showDatePicker}
        value={formData.expiryDate}
        onConfirm={(date) => {
          updateField("expiryDate", date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </ScreenContainer>
  );
}
