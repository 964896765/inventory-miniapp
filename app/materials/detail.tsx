import {
  ScrollView,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import QRCode from "react-native-qrcode-svg";
import Barcode from "react-native-barcode-builder";

interface MaterialDetail {
  id: number;
  name: string;
  category: string;
  unit: string;
  specs?: string;
  image?: string;
  barcode?: string;
  price?: number;
  warningLevel?: number;
  expiryDate?: string;
  notes?: string;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 材料详情页面（商品详情页风格）
 * 
 * 功能：
 * - 查看材料完整信息
 * - 显示条码和二维码
 * - 保存条码/二维码到相册
 * - 只保留价格字段（删除入库/出库价格）
 */
export default function MaterialDetailScreen() {
  const params = useLocalSearchParams();
  const materialId = params.id ? Number(params.id) : null;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const barcodeRef = useRef(null);
  const qrcodeRef = useRef(null);

  // 加载材料详情
  useEffect(() => {
    const loadMaterial = async () => {
      if (!materialId) {
        Alert.alert("错误", "材料ID无效", [
          { text: "确定", onPress: () => router.back() },
        ]);
        return;
      }

      try {
        setLoading(true);
        // TODO: 调用API获取材料详情
        // const response = await trpc.materials.getById.query({ id: materialId });
        
        // 模拟数据
        setMaterial({
          id: materialId,
          name: "B14-01-0077",
          category: "隔膜",
          unit: "m²",
          specs: "76mm*32mm",
          image: "",
          barcode: "845842075",
          price: 0.2,
          warningLevel: 0,
          expiryDate: "2026-02-16",
          notes: "",
          stockQuantity: 0,
          createdAt: "2024-01-15 10:30:00",
          updatedAt: "2024-02-17 09:50:00",
        });
      } catch (error) {
        console.error("加载材料详情失败:", error);
        Alert.alert("错误", "加载材料详情失败");
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [materialId]);

  // 保存条码到相册
  const saveBarcode = async () => {
    if (Platform.OS === "web") {
      Alert.alert("提示", "Web平台不支持保存到相册");
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("提示", "需要相册权限才能保存图片");
        return;
      }

      if (barcodeRef.current) {
        const uri = await captureRef(barcodeRef, {
          format: "png",
          quality: 1,
        });

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("库存管理", asset, false);
        
        Alert.alert("成功", "条码已保存到相册");
      }
    } catch (error) {
      console.error("保存条码失败:", error);
      Alert.alert("错误", "保存条码失败");
    }
  };

  // 保存二维码到相册
  const saveQRCode = async () => {
    if (Platform.OS === "web") {
      Alert.alert("提示", "Web平台不支持保存到相册");
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("提示", "需要相册权限才能保存图片");
        return;
      }

      if (qrcodeRef.current) {
        const uri = await captureRef(qrcodeRef, {
          format: "png",
          quality: 1,
        });

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("库存管理", asset, false);
        
        Alert.alert("成功", "二维码已保存到相册");
      }
    } catch (error) {
      console.error("保存二维码失败:", error);
      Alert.alert("错误", "保存二维码失败");
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">加载中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!material) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">商品不存在</Text>
        </View>
      </ScreenContainer>
    );
  }

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
        <Text className="text-lg font-semibold text-white">商品详情</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* 基本信息卡片 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base text-muted mb-1">商品名称 *</Text>
              <Text className="text-lg font-semibold text-foreground">
                {material.name}
              </Text>
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-base text-muted mb-1">商品分类 *</Text>
            <Text className="text-base text-foreground">{material.category}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-base text-muted mb-1">商品单位 *</Text>
            <Text className="text-base text-foreground">{material.unit}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-base text-muted mb-1">规格名称</Text>
            <Text className="text-base text-foreground">
              {material.specs || "无"}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-base text-muted mb-1">商品图片</Text>
            {material.image ? (
              <Image
                source={{ uri: material.image }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
            ) : (
              <Text className="text-sm text-muted">无图片</Text>
            )}
          </View>
        </View>

        {/* 条码/二维码卡片 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-base text-muted mb-1">条码/二维码</Text>
          <Text className="text-base text-foreground mb-3">
            {material.barcode || "留空会自动生成"}
          </Text>

          {/* 条码显示 */}
          <View ref={barcodeRef} className="bg-white p-4 rounded-lg mb-3 items-center">
            {material.barcode ? (
              <>
                <Barcode
                  value={material.barcode}
                  format="CODE128"
                  width={2}
                  height={80}
                  text={material.barcode}
                />
                <Text className="text-xs text-error mt-2">
                  打印条码时，条码四周需要矩阵空白，才易于识别。
                </Text>
              </>
            ) : (
              <Text className="text-sm text-muted">无条码</Text>
            )}
          </View>

          <Pressable
            onPress={saveBarcode}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View className="bg-primary rounded-lg py-2 items-center mb-3">
              <Text className="text-white text-sm">保存商品条形码到相册&gt;&gt;</Text>
            </View>
          </Pressable>

          {/* 二维码显示 */}
          <View ref={qrcodeRef} className="bg-white p-4 rounded-lg mb-3 items-center">
            {material.barcode ? (
              <QRCode
                value={material.barcode}
                size={150}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <Text className="text-sm text-muted">无二维码</Text>
            )}
          </View>

          <Pressable
            onPress={saveQRCode}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View className="bg-primary rounded-lg py-2 items-center">
              <Text className="text-white text-sm">保存商品二维码到相册&gt;&gt;</Text>
            </View>
          </Pressable>
        </View>

        {/* 价格信息卡片 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-base text-muted mb-1">价格</Text>
          <Text className="text-lg font-semibold text-foreground">
            ¥{material.price?.toFixed(2) || "0.00"}
          </Text>
        </View>

        {/* 库存信息卡片 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="mb-3">
            <Text className="text-base text-muted mb-1">库存预警</Text>
            <Text className="text-base text-foreground">
              {material.warningLevel || 0}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-base text-muted mb-1">有效期</Text>
            <Text className="text-base text-foreground">
              {material.expiryDate || "无"}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-base text-muted mb-1">备注</Text>
            <Text className="text-base text-foreground">
              {material.notes || "无"}
            </Text>
          </View>

          <View>
            <Text className="text-base text-muted mb-1">当前库存</Text>
            <Text className="text-lg font-semibold text-foreground">
              {material.stockQuantity} {material.unit}
            </Text>
          </View>
        </View>

        {/* 时间信息卡片 */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="mb-3">
            <Text className="text-base text-muted mb-1">创建时间</Text>
            <Text className="text-base text-foreground">{material.createdAt}</Text>
          </View>

          <View>
            <Text className="text-base text-muted mb-1">更新时间</Text>
            <Text className="text-base text-foreground">{material.updatedAt}</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <Pressable
          onPress={() => router.push(`/materials/add?id=${material.id}`)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View className="bg-primary rounded-lg py-3 items-center">
            <Text className="text-white text-base font-semibold">编辑商品</Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
