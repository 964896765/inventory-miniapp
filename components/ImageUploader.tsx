import { useState } from "react";
import { View, Text, Modal, Pressable, Image, Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ImageUploaderProps {
  visible: boolean;
  onImagesSelected: (images: string[]) => void;
  onCancel: () => void;
  maxImages?: number; // 最多选择图片数量
}

/**
 * 图片上传组件
 * 
 * 功能：
 * 1. 拍摄（调用相机拍照）
 * 2. 从相册选择
 * 3. 取消
 * 
 * 参考截图：底部弹窗样式，三个选项垂直排列
 */
export function ImageUploader({ visible, onImagesSelected, onCancel, maxImages = 9 }: ImageUploaderProps) {
  const colors = useColors();
  const [isProcessing, setIsProcessing] = useState(false);

  // 请求相机权限
  const requestCameraPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("权限不足", "需要相机权限才能拍照");
        return false;
      }
    }
    return true;
  };

  // 请求相册权限
  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("权限不足", "需要相册权限才能选择图片");
        return false;
      }
    }
    return true;
  };

  // 拍摄照片
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUris = result.assets.map((asset) => asset.uri);
        onImagesSelected(imageUris);
      }
    } catch (error) {
      Alert.alert("错误", "拍照失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  // 从相册选择
  const handlePickFromLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsMultipleSelection: true,
        selectionLimit: maxImages,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUris = result.assets.map((asset) => asset.uri);
        onImagesSelected(imageUris);
      }
    } catch (error) {
      Alert.alert("错误", "选择图片失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/50 justify-end">
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl">
          {/* 拍摄 */}
          <Pressable
            onPress={handleTakePhoto}
            disabled={isProcessing}
            className="px-4 py-5 border-b border-border"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-center text-lg text-foreground">拍摄</Text>
          </Pressable>

          {/* 从相册选择 */}
          <Pressable
            onPress={handlePickFromLibrary}
            disabled={isProcessing}
            className="px-4 py-5 border-b border-border"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-center text-lg text-foreground">从相册选择</Text>
          </Pressable>

          {/* 取消 */}
          <Pressable
            onPress={onCancel}
            className="px-4 py-5"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-center text-lg text-muted">取消</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
