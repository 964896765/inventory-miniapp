import {
  Modal,
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
} from "react-native";
import { useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface PickerItem {
  id: number;
  name: string;
  [key: string]: any;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId?: number | null;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
  onManage?: () => void;
  manageButtonText?: string;
  searchPlaceholder?: string;
}

/**
 * 通用选择器组件
 * 
 * 功能：
 * - 显示列表供用户选择
 * - 支持搜索功能
 * - 可选的"管理"按钮（跳转到管理页面）
 */
export function PickerModal({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
  onManage,
  manageButtonText = "管理",
  searchPlaceholder = "搜索...",
}: PickerModalProps) {
  const [searchText, setSearchText] = useState("");

  // 过滤列表
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        {/* 弹窗容器 */}
        <View className="flex-1 mt-20 bg-background rounded-t-3xl">
          {/* 顶部标题栏 */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <IconSymbol name="chevron.right" size={24} color="#687076" />
            </Pressable>
          </View>

          {/* 搜索框 */}
          <View className="px-4 py-3 border-b border-border">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-2 text-base text-foreground"
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>

          {/* 列表 */}
          <ScrollView className="flex-1">
            {filteredItems.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-muted text-base">暂无数据</Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    className={`px-4 py-4 border-b border-border ${
                      selectedId === item.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        selectedId === item.id
                          ? "text-primary font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>

          {/* 底部管理按钮 */}
          {onManage && (
            <View className="px-4 py-3 border-t border-border">
              <Pressable
                onPress={() => {
                  onManage();
                  onClose();
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="bg-primary rounded-xl py-3 items-center">
                  <Text className="text-white text-base font-semibold">
                    {manageButtonText}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
