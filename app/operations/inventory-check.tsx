import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DatePicker } from "@/components/DatePicker";
import { WarehousePicker } from "@/components/WarehousePicker";
import { ImageUploader } from "@/components/ImageUploader";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface InventoryItem {
  id: number;
  code: string;
  name: string;
  specs: string;
  unit: string;
  stockQuantity: number; // 库存数
  checkQuantity: number; // 盘点数
  diffQuantity: number; // 盘亏数
  price: number;
  diffAmount: number; // 盘亏额
}

/**
 * 仓库盘点页面
 * 
 * 严格按照视频截图布局：
 * 1. 提示文字（点击"提交盘点"后，系统根据盘点单材料数据，自动生成入库单(盘点入库)、出库单(盘点出库)）
 * 2. 日期*
 * 3. 仓库*
 * 4. 备注
 * 5. 扫码选择材料 / 手动选择材料
 * 6. 盘点表格（材料、盘点数/库存数、盘亏数/盘亏额）
 * 7. 合计（盘点数、库存数、盘亏数、盘亏额）
 * 8. 提交盘点按钮
 */
export default function InventoryCheckScreen() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    warehouse: "主材仓",
    notes: "",
  });

  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: 1,
      code: "B15-01-0055",
      name: "dghj",
      specs: "",
      unit: "kg",
      stockQuantity: 1,
      checkQuantity: 1,
      diffQuantity: 0,
      price: 0,
      diffAmount: 0,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  // 更新表单字段
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 选择日期
  const selectDate = () => {
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: string) => {
    updateField("date", date);
    setShowDatePicker(false);
  };

  // 选择仓库
  const selectWarehouse = () => {
    setShowWarehousePicker(true);
  };

  const handleWarehouseSelect = (warehouse: { id: number; name: string }) => {
    updateField("warehouse", warehouse.name);
    setShowWarehousePicker(false);
  };

  // 扫码选择材料
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const scanMaterial = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setShowBarcodeScanner(false);
    // TODO: 根据条码查询材料并添加到列表
    Alert.alert("扫码成功", `条码: ${barcode}`);
  };

  // 手动选择材料
  const selectMaterial = () => {
    router.push("/operations/select-materials");
  };

  // 选择附件图片
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [attachmentImages, setAttachmentImages] = useState<string[]>([]);

  const selectAttachments = () => {
    setShowImageUploader(true);
  };

  const handleImagesSelected = (images: string[]) => {
    setAttachmentImages((prev) => [...prev, ...images].slice(0, 9)); // 最多9张
    setShowImageUploader(false);
  };

  // 计算合计
  const calculateTotal = () => {
    const totalCheck = items.reduce((sum, item) => sum + item.checkQuantity, 0);
    const totalStock = items.reduce((sum, item) => sum + item.stockQuantity, 0);
    const totalDiff = items.reduce((sum, item) => sum + item.diffQuantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.diffAmount, 0);
    return { totalCheck, totalStock, totalDiff, totalAmount };
  };

  // 提交盘点
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.warehouse) {
      Alert.alert("提示", "请选择仓库");
      return;
    }
    if (items.length === 0) {
      Alert.alert("提示", "请添加盘点材料");
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用API提交盘点单
      Alert.alert("成功", "盘点单已提交", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("提交盘点单失败:", error);
      Alert.alert("错误", "提交盘点单失败");
    } finally {
      setLoading(false);
    }
  };

  const { totalCheck, totalStock, totalDiff, totalAmount } = calculateTotal();

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
        <Text className="text-lg font-semibold text-white">仓库盘点</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 提示文字 */}
        <View className="bg-error/10 px-4 py-3 mx-4 mt-4 rounded-xl">
          <Text className="text-sm text-error leading-relaxed">
            点击"提交盘点"后，系统根据盘点单材料数据，自动生成入库单(盘点入库)、出库单(盘点出库)。
          </Text>
        </View>

        {/* 日期 */}
        <Pressable
          onPress={selectDate}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View className="bg-white border-b border-border px-4 py-4 flex-row items-center justify-between mt-4">
            <Text className="text-base text-foreground">
              日期 <Text className="text-error">*</Text>
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-base text-foreground">{formData.date}</Text>
              <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
            </View>
          </View>
        </Pressable>

        {/* 仓库 */}
        <Pressable
          onPress={selectWarehouse}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View className="bg-white border-b border-border px-4 py-4 flex-row items-center justify-between">
            <Text className="text-base text-foreground">
              仓库 <Text className="text-error">*</Text>
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-base text-foreground">{formData.warehouse}</Text>
              <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
            </View>
          </View>
        </Pressable>

        {/* 备注 */}
        <View className="bg-white border-b border-border px-4 py-4">
          <Text className="text-base text-foreground mb-2">备注</Text>
          <TextInput
            className="text-base text-foreground"
            placeholder="请填写备注"
            placeholderTextColor="#9CA3AF"
            multiline
            value={formData.notes}
            onChangeText={(value) => updateField("notes", value)}
          />
        </View>

        {/* 扫码/手动选择材料 */}
        <View className="bg-background py-4 px-4 flex-row gap-4">
          <Pressable
            onPress={scanMaterial}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flex: 1 })}
          >
            <View className="bg-white border border-primary rounded-xl py-4 flex-row items-center justify-center gap-2">
              <Text className="text-primary text-base">📷</Text>
              <Text className="text-primary text-base font-semibold">扫码选择材料</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={selectMaterial}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flex: 1 })}
          >
            <View className="bg-white border border-primary rounded-xl py-4 flex-row items-center justify-center gap-2">
              <Text className="text-primary text-base">✏️</Text>
              <Text className="text-primary text-base font-semibold">手动选择材料</Text>
            </View>
          </Pressable>
        </View>

        {/* 盘点表格 */}
        {items.length > 0 && (
          <View className="bg-white mx-4 rounded-xl overflow-hidden">
            {/* 表头 */}
            <View className="bg-surface px-4 py-3 flex-row items-center border-b border-border">
              <Text className="text-sm font-semibold text-foreground flex-1">材料</Text>
              <Text className="text-sm font-semibold text-foreground w-24 text-center">
                盘点数{"\n"}库存数
              </Text>
              <Text className="text-sm font-semibold text-foreground w-24 text-center">
                盘亏数{"\n"}盘亏额
              </Text>
            </View>

            {/* 数据行 */}
            {items.map((item, index) => (
              <View
                key={item.id}
                className={`px-4 py-3 flex-row items-center ${
                  index < items.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground mb-1">
                    {item.code}
                  </Text>
                  <Text className="text-sm text-muted">{item.name}</Text>
                </View>
                <View className="w-24">
                  <Text className="text-sm text-foreground text-center">
                    {item.checkQuantity}
                  </Text>
                  <Text className="text-sm text-foreground text-center">
                    {item.stockQuantity}
                  </Text>
                </View>
                <View className="w-24">
                  <Text className="text-sm text-foreground text-center">
                    {item.diffQuantity}
                  </Text>
                  <Text className="text-sm text-error text-center">
                    ¥ {item.diffAmount.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}

            {/* 合计 */}
            <View className="bg-surface px-4 py-3 flex-row items-center border-t border-border">
              <Text className="text-base font-semibold text-foreground flex-1">合计</Text>
              <View className="w-24">
                <Text className="text-sm text-foreground text-center">{totalCheck}</Text>
                <Text className="text-sm text-foreground text-center">{totalStock}</Text>
              </View>
              <View className="w-24">
                <Text className="text-sm text-foreground text-center">{totalDiff}</Text>
                <Text className="text-sm text-error text-center">
                  ¥ {totalAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部提交按钮 */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3">
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => ({
            opacity: pressed || loading ? 0.7 : 1,
          })}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white text-lg font-semibold">
              {loading ? "提交中..." : "提交盘点"}
            </Text>
          </View>
        </Pressable>
      </View>
      {/* 日期选择器 */}
      <DatePicker
        visible={showDatePicker}
        value={formData.date}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* 仓库选择器 */}
      <WarehousePicker
        visible={showWarehousePicker}
        onSelect={handleWarehouseSelect}
        onCancel={() => setShowWarehousePicker(false)}
      />

      {/* 图片上传组件 */}
      <ImageUploader
        visible={showImageUploader}
        onImagesSelected={handleImagesSelected}
        onCancel={() => setShowImageUploader(false)}
        maxImages={9}
      />

      {/* 扫码组件 */}
      <BarcodeScanner
        visible={showBarcodeScanner}
        onBarcodeScanned={handleBarcodeScanned}
        onCancel={() => setShowBarcodeScanner(false)}
      />
    </ScreenContainer>
  );
}
