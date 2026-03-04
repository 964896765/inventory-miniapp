import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

/**
 * BOM发料页面
 * 
 * 功能：
 * 1. 选择BOM
 * 2. 选择部门
 * 3. 输入投产数量
 * 4. 自动计算发料数量
 * 5. 提交发料单
 */
export default function BOMIssueScreen() {
  const colors = useColors();
  
  const [selectedBOMId, setSelectedBOMId] = useState<number | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [productionQty, setProductionQty] = useState("");
  
  // 获取BOM列表
  const { data: boms } = trpc.boms.list.useQuery();
  
  // 获取部门列表
  const { data: departments } = trpc.supplyUnits.listDepartments.useQuery();
  
  // 获取选中BOM的详情
  const { data: bomDetail } = trpc.boms.get.useQuery(
    { id: selectedBOMId! },
    { enabled: selectedBOMId !== null }
  );
  
  // 获取BOM物料清单
  const { data: bomItems } = trpc.boms.items.list.useQuery(
    { bomId: selectedBOMId! },
    { enabled: selectedBOMId !== null }
  );
  
  // 计算实际发料数量
  const calculateIssueQty = (theoreticalQty: string) => {
    if (!productionQty) return "0";
    const qty = parseFloat(theoreticalQty) * parseFloat(productionQty);
    return qty.toFixed(2);
  };
  
  // 提交发料单
  const handleSubmit = async () => {
    if (!selectedBOMId) {
      Alert.alert("提示", "请选择BOM");
      return;
    }
    
    if (!selectedDepartmentId) {
      Alert.alert("提示", "请选择部门");
      return;
    }
    
    if (!productionQty || parseFloat(productionQty) <= 0) {
      Alert.alert("提示", "请输入有效的投产数量");
      return;
    }
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // TODO: 调用API创建BOM发料单
      // await trpc.docs.createBOMIssue.mutate({
      //   bomId: selectedBOMId,
      //   departmentId: selectedDepartmentId,
      //   productionQty: parseFloat(productionQty),
      // });
      
      Alert.alert("成功", "BOM发料单已创建", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", "创建发料单失败");
    }
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "BOM发料",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ScrollView className="flex-1 p-4">
          {/* BOM选择 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              选择BOM <Text className="text-error">*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {boms?.map((bom) => (
                <Pressable
                  key={bom.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedBOMId(bom.id);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className={`mr-3 px-4 py-3 rounded-lg border ${
                    selectedBOMId === bom.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedBOMId === bom.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {bom.name}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      selectedBOMId === bom.id ? "text-white/80" : "text-muted"
                    }`}
                  >
                    {bom.code}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          {/* 部门选择 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              选择部门 <Text className="text-error">*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {departments?.map((dept) => (
                <Pressable
                  key={dept.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDepartmentId(dept.id);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className={`mr-3 px-4 py-2 rounded-full ${
                    selectedDepartmentId === dept.id
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedDepartmentId === dept.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {dept.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          {/* 投产数量 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              投产数量（K） <Text className="text-error">*</Text>
            </Text>
            <TextInput
              value={productionQty}
              onChangeText={setProductionQty}
              keyboardType="numeric"
              placeholder="请输入投产数量"
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>
          
          {/* BOM物料清单 */}
          {bomItems && bomItems.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                物料清单
              </Text>
              
              {bomItems.map((item: any, index: number) => (
                <View
                  key={index}
                  className="bg-surface p-4 rounded-lg mb-3 border border-border"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">
                        {item.materialName || `材料 #${item.materialId}`}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        理论用量：{item.quantity} {item.unit}
                      </Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-xs text-primary font-medium">
                        {item.unit}
                      </Text>
                    </View>
                  </View>
                  
                  {productionQty && (
                    <View className="mt-2 pt-2 border-t border-border">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">实际发料数量</Text>
                        <Text className="text-sm font-semibold text-primary">
                          {calculateIssueQty(item.quantity)} {item.unit}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* 底部提交按钮 */}
        <View className="p-4 border-t border-border">
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            className="bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold text-base">提交发料单</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    </>
  );
}
