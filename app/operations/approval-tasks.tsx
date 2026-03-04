import { useState } from "react";
import { View, Text, ScrollView, Pressable, FlatList, RefreshControl, Alert, TextInput } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type TabType = "pending" | "approved" | "rejected";

/**
 * 审批作业页面
 * 
 * 功能：
 * 1. Tab切换：待我审/我审过/我驳回
 * 2. 显示审批任务列表
 * 3. 点击任务查看详情
 * 4. 执行审批操作（通过/驳回）
 */
export default function ApprovalTasksScreen() {
  const colors = useColors();
  
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // 获取当前用户ID（TODO: 从auth context获取）
  const currentUserId = 1;
  
  // 获取审批任务列表
  const { data: tasks, refetch } = trpc.approval.listTasks.useQuery({
    tab: activeTab,
    approverId: currentUserId,
  });
  
  // 审批通过
  const approveMutation = trpc.approval.approve.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "审批已通过");
      refetch();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", "审批失败");
    },
  });
  
  // 审批驳回
  const rejectMutation = trpc.approval.reject.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "已驳回");
      setShowRejectDialog(false);
      setRejectReason("");
      refetch();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", "驳回失败");
    },
  });
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  const handleApprove = (docId: number) => {
    Alert.alert("确认", "确定要通过这个审批吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "通过",
        onPress: () => {
          approveMutation.mutate({ docId });
        },
      },
    ]);
  };
  
  const handleReject = (docId: number) => {
    setSelectedDocId(docId);
    setShowRejectDialog(true);
  };
  
  const confirmReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert("提示", "请输入驳回原因");
      return;
    }
    
    if (selectedDocId) {
      rejectMutation.mutate({
        docId: selectedDocId,
        reason: rejectReason,
      });
    }
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "text-warning";
      case "approved":
        return "text-success";
      case "rejected":
        return "text-error";
      default:
        return "text-muted";
    }
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "审批作业",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        {/* Tab切换 */}
        <View className="flex-row bg-surface border-b border-border">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("pending");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 items-center ${
              activeTab === "pending" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "pending" ? "text-primary" : "text-muted"
              }`}
            >
              待我审
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("approved");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 items-center ${
              activeTab === "approved" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "approved" ? "text-primary" : "text-muted"
              }`}
            >
              我审过
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("rejected");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 items-center ${
              activeTab === "rejected" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "rejected" ? "text-primary" : "text-muted"
              }`}
            >
              我驳回
            </Text>
          </Pressable>
        </View>
        
        {/* 任务列表 */}
        <FlatList
          data={tasks || []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="bg-surface m-4 p-4 rounded-lg border border-border">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="bg-primary/10 px-2 py-1 rounded">
                      <Text className="text-xs text-primary font-medium">
                        {getDocTypeText(item.docType)}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">
                      {item.docNo}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                
                <View className={`px-3 py-1 rounded-full ${
                  item.status === "submitted" ? "bg-warning/10" :
                  item.status === "approved" ? "bg-success/10" :
                  "bg-error/10"
                }`}>
                  <Text className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status === "submitted" ? "待审批" :
                     item.status === "approved" ? "已通过" :
                     "已驳回"}
                  </Text>
                </View>
              </View>
              
              {item.remark && (
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted mb-1">备注</Text>
                  <Text className="text-sm text-foreground">{item.remark}</Text>
                </View>
              )}
              
              {/* 待审批状态显示操作按钮 */}
              {activeTab === "pending" && (
                <View className="flex-row gap-3 mt-3">
                  <Pressable
                    onPress={() => handleReject(item.id)}
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                    className="flex-1 bg-error/10 py-2 rounded-lg items-center border border-error"
                  >
                    <Text className="text-error font-medium">驳回</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={() => handleApprove(item.id)}
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                    className="flex-1 bg-primary py-2 rounded-lg items-center"
                  >
                    <Text className="text-white font-medium">通过</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Text className="text-muted">
                {activeTab === "pending" ? "暂无待审批任务" :
                 activeTab === "approved" ? "暂无已通过记录" :
                 "暂无驳回记录"}
              </Text>
            </View>
          }
        />
        
        {/* 驳回原因对话框 */}
        {showRejectDialog && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center p-4">
            <View className="bg-surface rounded-lg p-4 w-full max-w-sm">
              <Text className="text-lg font-semibold text-foreground mb-3">
                驳回原因
              </Text>
              
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                numberOfLines={4}
                placeholder="请输入驳回原因"
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-4"
                placeholderTextColor={colors.muted}
                textAlignVertical="top"
              />
              
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowRejectDialog(false);
                    setRejectReason("");
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-1 bg-surface border border-border py-2 rounded-lg items-center"
                >
                  <Text className="text-foreground font-medium">取消</Text>
                </Pressable>
                
                <Pressable
                  onPress={confirmReject}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-1 bg-error py-2 rounded-lg items-center"
                >
                  <Text className="text-white font-medium">确认驳回</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScreenContainer>
    </>
  );
}
