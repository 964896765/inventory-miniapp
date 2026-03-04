import { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface DatePickerProps {
  visible: boolean;
  value: string; // 格式: YYYY-MM-DD
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

/**
 * 日期选择器组件（居中弹窗样式）
 * 
 * 三列滚动选择：年、月、日
 * 参考微信小程序的日期选择器样式
 */
export function DatePicker({ visible, onConfirm, onCancel, value }: DatePickerProps) {
  const colors = useColors();
  
  // 如果value为空或无效，使用当前日期
  const now = new Date();
  const defaultDate = value && value.includes("-") ? value : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const [year, month, day] = defaultDate.split("-");
  const [selectedYear, setSelectedYear] = useState(parseInt(year));
  const [selectedMonth, setSelectedMonth] = useState(parseInt(month));
  const [selectedDay, setSelectedDay] = useState(parseInt(day));

  // 生成年份列表（当前年份前后各10年）
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // 生成月份列表
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 生成日期列表（根据年月计算天数）
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    onConfirm(formattedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/50 items-center justify-center px-4">
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full bg-white rounded-2xl overflow-hidden">
          {/* 头部 */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable onPress={onCancel}>
              <Text className="text-base text-muted">取消</Text>
            </Pressable>
            <Text className="text-base font-semibold text-foreground">选择日期</Text>
            <Pressable onPress={handleConfirm}>
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                确定
              </Text>
            </Pressable>
          </View>

          {/* 滚动选择器 */}
          <View className="flex-row h-64 bg-background">
            {/* 年 */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {years.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => setSelectedYear(y)}
                  className="items-center justify-center py-3"
                  style={({ pressed }) => [{ 
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: selectedYear === y ? "#f0f0f0" : "transparent"
                  }]}
                >
                  <Text
                    className={`text-base ${
                      selectedYear === y ? "font-semibold text-foreground" : "text-muted"
                    }`}
                  >
                    {y}年
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 月 */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {months.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setSelectedMonth(m)}
                  className="items-center justify-center py-3"
                  style={({ pressed }) => [{ 
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: selectedMonth === m ? "#f0f0f0" : "transparent"
                  }]}
                >
                  <Text
                    className={`text-base ${
                      selectedMonth === m ? "font-semibold text-foreground" : "text-muted"
                    }`}
                  >
                    {String(m).padStart(2, "0")}月
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 日 */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {days.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDay(d)}
                  className="items-center justify-center py-3"
                  style={({ pressed }) => [{ 
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: selectedDay === d ? "#f0f0f0" : "transparent"
                  }]}
                >
                  <Text
                    className={`text-base ${
                      selectedDay === d ? "font-semibold text-foreground" : "text-muted"
                    }`}
                  >
                    {String(d).padStart(2, "0")}日
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* 底部按钮 */}
          <View className="flex-row px-4 py-3 gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 rounded-xl items-center"
              style={({ pressed }) => [
                { backgroundColor: "#f0f0f0", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text className="text-base font-semibold text-foreground">取消</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              className="flex-1 py-3 rounded-xl items-center"
              style={({ pressed }) => [
                { backgroundColor: "#07C160", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text className="text-white text-base font-semibold">确认</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
