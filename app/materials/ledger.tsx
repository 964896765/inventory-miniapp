import { useState, useEffect } from "react";
import { View, Text, ScrollView, FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

/**
 * 材料流水页面
 * 
 * 显示指定材料的库存流水记录
 */
export default function MaterialLedgerScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const materialId = params.id ? parseInt(params.id as string) : null;
  
  const [refreshing, setRefreshing] = useState(false);
  
  // 获取材料信息
  const { data: material } = trpc.materials.get.useQuery(
    { id: materialId! },
    { enabled: materialId !== null }
  );
  
  // TODO: 获取材料流水记录
  // const { data: ledgers, refetch } = trpc.stock.getLedger.useQuery(
  //   { materialId: materialId! },
  //   { enabled: materialId !== null }
  // );
  
  const ledgers: any[] = []; // 临时空数组
  
  const onRefresh = async () => {
    setRefreshing(true);
    // await refetch();
    setRefreshing(false);
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: material?.name || "材料流水",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        {/* 材料信息卡片 */}
        {material && (
          <View className="bg-surface m-4 p-4 rounded-lg border border-border">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold text-foreground">
                {material.name}
              </Text>
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-sm text-primary font-medium">
                  {material.unit || "个"}
                </Text>
              </View>
            </View>
            
            <View className="flex-row gap-4 mt-2">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">物料编码</Text>
                <Text className="text-sm text-foreground">{material.code}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">规格型号</Text>
                <Text className="text-sm text-foreground">{material.spec || "-"}</Text>
              </View>
            </View>
            
            {material.price && (
              <View className="mt-3 pt-3 border-t border-border">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">单价</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    ¥{material.price}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* 流水记录列表 */}
        <View className="flex-1 px-4">
          <Text className="text-sm font-semibold text-foreground mb-3">
            库存流水
          </Text>
          
          <FlatList
            data={ledgers}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View className="bg-surface p-4 rounded-lg mb-3 border border-border">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`w-2 h-2 rounded-full ${
                        item.direction === "IN" ? "bg-success" : "bg-error"
                      }`}
                    />
                    <Text className="text-sm font-medium text-foreground">
                      {item.direction === "IN" ? "入库" : "出库"}
                    </Text>
                  </View>
                  <Text className="text-sm text-muted">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center mt-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">数量</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {item.direction === "IN" ? "+" : "-"}
                      {item.quantity}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">结存</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {item.balance}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">仓库</Text>
                    <Text className="text-sm text-foreground" numberOfLines={1}>
                      {item.warehouseName || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text className="text-muted">暂无流水记录</Text>
              </View>
            }
          />
        </View>
      </ScreenContainer>
    </>
  );
}
