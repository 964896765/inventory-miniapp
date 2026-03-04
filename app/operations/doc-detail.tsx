import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { exportAndShare, generateExportFilename } from "@/lib/export";

/**
 * 单据详情页面
 * 
 * 功能：
 * 1. 显示单据基本信息
 * 2. 显示单据明细列表
 * 3. 显示审批记录
 * 4. 支持删除草稿单据
 */
export default function DocDetailScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const docId = Number(params.id);
  
  // 获取单据详情
  const { data: doc, refetch } = trpc.docs.getDetail.useQuery({ id: docId });
  
  // 获取审批记录
  const { data: approvalLogs } = trpc.approval.listLogs.useQuery({ docId });
  
  // 删除单据
  const deleteMutation = trpc.docs.delete.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "单据已删除", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", error.message || "删除失败");
    },
  });
  
  const handleExport = async () => {
    if (!doc || !doc.items) {
      Alert.alert("提示", "暂无数据可导出");
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // 准备导出数据
      const exportData = doc.items.map((item: any) => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || "",
        batchNo: item.batchNo || "",
        remark: item.remark || "",
      }));
      
      const columns = [
        { key: "materialId" as const, label: "材料ID" },
        { key: "quantity" as const, label: "数量" },
        { key: "unitPrice" as const, label: "单价" },
        { key: "batchNo" as const, label: "批次号" },
        { key: "remark" as const, label: "备注" },
      ];
      
      const filename = generateExportFilename(`单据_${doc.docNo}`);
      
      await exportAndShare(exportData, columns, filename, `分享单据 ${doc.docNo}`);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", error instanceof Error ? error.message : "导出失败");
    }
  };
  
  const handleDelete = () => {
    Alert.alert("确认", "确定要删除这个单据吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate({ id: docId });
        },
      },
    ]);
  };
  
  const getDocTypeText = (docType: string) => {
    const typeMap: Record<string, string> = {
      stock_in: "入库",
      stock_out: "出库",
      transfer: "调拨",
      inventory_check: "盘点",
      bom_issue: "BOM发料",
      return: "退仓",
      exchange: "换料",
      adjustment: "平账",
    };
    return typeMap[docType] || docType;
  };
  
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: "草稿",
      submitted: "已提交",
      approved: "已审批",
      rejected: "已驳回",
      posted: "已过账",
    };
    return statusMap[status] || status;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted/10 text-muted";
      case "submitted":
        return "bg-warning/10 text-warning";
      case "approved":
        return "bg-success/10 text-success";
      case "rejected":
        return "bg-error/10 text-error";
      case "posted":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted/10 text-muted";
    }
  };
  
  if (!doc) {
    return (
      <>
        <Stack.Screen options={{ title: "单据详情", headerShown: true }} />
        <ScreenContainer>
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">加载中...</Text>
          </View>
        </ScreenContainer>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "单据详情",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ScrollView className="flex-1">
          {/* 单据基本信息 */}
          <View className="bg-primary/5 p-4 mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="bg-primary/20 px-3 py-1 rounded">
                    <Text className="text-sm text-primary font-semibold">
                      {getDocTypeText(doc.docType)}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded ${getStatusColor(doc.status)}`}>
                    <Text className="text-xs font-medium">
                      {getStatusText(doc.status)}
                    </Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-foreground mb-1">
                  {doc.docNo}
                </Text>
                <Text className="text-xs text-muted">
                  创建时间：{new Date(doc.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
            
            {doc.notes && (
              <View className="mt-2 pt-2 border-t border-border/30">
                <Text className="text-xs text-muted mb-1">备注</Text>
                <Text className="text-sm text-foreground">{doc.notes}</Text>
              </View>
            )}
          </View>
          
          {/* 单据明细 */}
          <View className="bg-surface mx-4 mb-4 p-4 rounded-lg border border-border">
            <Text className="text-base font-semibold text-foreground mb-3">
              单据明细
            </Text>
            
            {doc.items && doc.items.length > 0 ? (
              doc.items.map((item: any, index: number) => (
                <View
                  key={item.id}
                  className={`py-3 ${
                    index < doc.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-sm font-medium text-foreground flex-1">
                      材料 #{item.materialId}
                    </Text>
                    <Text className="text-sm font-semibold text-primary">
                      {item.quantity} 件
                    </Text>
                  </View>
                  
                  {item.unitPrice && (
                    <Text className="text-xs text-muted">
                      单价：¥{item.unitPrice}
                    </Text>
                  )}
                  
                  {item.batchNo && (
                    <Text className="text-xs text-muted">
                      批次号：{item.batchNo}
                    </Text>
                  )}
                  
                  {item.remark && (
                    <Text className="text-xs text-muted mt-1">
                      备注：{item.remark}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text className="text-muted text-center py-4">暂无明细</Text>
            )}
          </View>
          
          {/* 审批记录 */}
          {approvalLogs && approvalLogs.length > 0 && (
            <View className="bg-surface mx-4 mb-4 p-4 rounded-lg border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                审批记录
              </Text>
              
              {approvalLogs.map((log: any, index: number) => (
                <View
                  key={log.id}
                  className={`py-3 ${
                    index < approvalLogs.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-sm font-medium text-foreground">
                      用户 {log.actorId}
                    </Text>
                    <View className={`px-2 py-1 rounded ${
                      log.action === "approve" ? "bg-success/10" : "bg-error/10"
                    }`}>
                      <Text className={`text-xs font-medium ${
                        log.action === "approve" ? "text-success" : "text-error"
                      }`}>
                        {log.action === "approve" ? "通过" : "驳回"}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-xs text-muted mb-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </Text>
                  
                  {log.reason && (
                    <Text className="text-xs text-foreground mt-1">
                      {log.action === "approve" ? "意见" : "原因"}：{log.reason}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {/* 导出和分享按钮 */}
          <View className="mx-4 mb-4">
            <Pressable
              onPress={handleExport}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              className="bg-primary py-4 rounded-lg items-center mb-3"
            >
              <Text className="text-white font-semibold">导出并分享</Text>
            </Pressable>
          </View>
          
          {/* 删除按钮（仅草稿状态） */}
          {doc.status === "draft" && (
            <View className="mx-4 mb-4">
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
                className="bg-error py-4 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">删除单据</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
