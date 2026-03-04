import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, StyleSheet, Platform, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/use-colors";

interface BarcodeScannerProps {
  visible: boolean;
  onBarcodeScanned: (barcode: string) => void;
  onCancel: () => void;
}

/**
 * 条码扫描器组件
 * 
 * 功能：
 * 1. 调用相机扫描条码/二维码
 * 2. 扫描成功后返回条码数据
 * 3. 支持取消操作
 */
export function BarcodeScanner({ visible, onBarcodeScanned, onCancel }: BarcodeScannerProps) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // 请求相机权限
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  // 重置扫描状态
  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  // 处理扫码结果
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    onBarcodeScanned(data);
  };

  // 从相册选择条码图片
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        // 注意：expo-image-picker不支持直接识别条码，这里只是选择图片
        // 实际应用中需要使用OCR或条码识别库来解析图片中的条码
        Alert.alert("提示", "从相册选择条码功能需要集成条码识别库");
        // TODO: 集成条码识别库（如expo-barcode-scanner或第三方服务）
      }
    } catch (error) {
      Alert.alert("错误", "选择图片失败");
    }
  };

  // Web平台不支持相机
  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
        <View style={styles.container}>
          <View style={styles.webNotSupported}>
            <Text style={styles.webNotSupportedText}>Web平台不支持相机扫码</Text>
            <Pressable onPress={onCancel} style={styles.webButton}>
              <Text style={styles.webButtonText}>关闭</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // 权限未授予
  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>需要相机权限才能扫码</Text>
            <Pressable onPress={requestPermission} style={[styles.button, { backgroundColor: colors.primary }]}>
              <Text style={styles.buttonText}>授予权限</Text>
            </Pressable>
            <Pressable onPress={onCancel} style={[styles.button, { backgroundColor: colors.muted, marginTop: 12 }]}>
              <Text style={styles.buttonText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "code93", "codabar", "upc_a", "upc_e"],
          }}
        >
          {/* 扫描框 */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>将条码放入框内扫描</Text>
          </View>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <Pressable
              onPress={handlePickFromGallery}
              style={[styles.galleryButton, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>相册</Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={[styles.cancelButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </Pressable>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#fff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  hint: {
    marginTop: 20,
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  galleryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  webNotSupported: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  webNotSupportedText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  webButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#5B7FC7",
  },
  webButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
