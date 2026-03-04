import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

/**
 * 成员权限编辑页面
 * 
 * 功能：
 * 1. 显示所有权限点
 * 2. 编辑成员权限（开关）
 * 3. 保存权限配置
 */
export default function MemberPermissionsScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const memberId = Number(params.id);
  
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  
  // 获取所有权限点
  const { data: allPermissions } = trpc.permissions.list.useQuery();
  
  // 获取成员当前权限
  const { data: member } = trpc.team.getMember.useQuery({ id: memberId });
  
  // 更新权限
  const updateMutation = trpc.team.updateMemberPermissions.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "权限已更新", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("错误", error.message || "更新失败");
    },
  });
  
  // 初始化权限状态
  useEffect(() => {
    if (member?.permissions) {
      setPermissions(member.permissions as Record<string, boolean>);
    }
  }, [member]);
  
  const handleToggle = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const handleSave = () => {
    updateMutation.mutate({
      memberId,
      permissions,
    });
  };
  
  // 权限分组
  const permissionGroups = [
    {
      title: "基础资料",
      permissions: [
        { key: "warehouse.view", name: "查看仓库", description: "查看仓库列表和详情" },
        { key: "warehouse.edit", name: "编辑仓库", description: "创建、编辑、删除仓库" },
        { key: "material.view", name: "查看材料", description: "查看材料列表和详情" },
        { key: "material.edit", name: "编辑材料", description: "创建、编辑、删除材料" },
        { key: "bom.view", name: "查看BOM", description: "查看BOM列表和详情" },
        { key: "bom.edit", name: "编辑BOM", description: "创建、编辑、删除BOM" },
      ],
    },
    {
      title: "库存操作",
      permissions: [
        { key: "stock.in", name: "入库", description: "创建入库单" },
        { key: "stock.out", name: "出库", description: "创建出库单" },
        { key: "stock.transfer", name: "调拨", description: "创建调拨单" },
        { key: "stock.check", name: "盘点", description: "创建盘点单" },
        { key: "stock.bom_issue", name: "BOM发料", description: "创建BOM发料单" },
        { key: "stock.return", name: "退仓", description: "创建退仓单" },
        { key: "stock.exchange", name: "换料", description: "创建换料单" },
        { key: "stock.adjustment", name: "平账", description: "创建平账单" },
      ],
    },
    {
      title: "审批权限",
      permissions: [
        { key: "approval.config", name: "审批配置", description: "配置审批流程和审批人" },
        { key: "approval.approve", name: "审批单据", description: "审批或驳回单据" },
      ],
    },
    {
      title: "记录查询",
      permissions: [
        { key: "record.doc", name: "查看单据记录", description: "查看所有单据记录" },
        { key: "record.ledger", name: "查看材料流水", description: "查看材料流水记录" },
        { key: "record.approval", name: "查看审批记录", description: "查看审批记录" },
      ],
    },
    {
      title: "团队管理",
      permissions: [
        { key: "team.member", name: "成员管理", description: "邀请、编辑、删除成员" },
        { key: "team.permission", name: "权限管理", description: "编辑成员权限" },
      ],
    },
  ];
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "编辑权限",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ScrollView className="flex-1">
          {permissionGroups.map((group, groupIndex) => (
            <View key={groupIndex} className="mb-4">
              <View className="bg-surface/50 px-4 py-2">
                <Text className="text-sm font-semibold text-foreground">
                  {group.title}
                </Text>
              </View>
              
              {group.permissions.map((permission, permIndex) => (
                <View
                  key={permission.key}
                  className={`bg-surface px-4 py-3 flex-row justify-between items-center ${
                    permIndex < group.permissions.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-sm font-medium text-foreground mb-1">
                      {permission.name}
                    </Text>
                    <Text className="text-xs text-muted">
                      {permission.description}
                    </Text>
                  </View>
                  
                  <Switch
                    value={permissions[permission.key] || false}
                    onValueChange={() => handleToggle(permission.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>
              ))}
            </View>
          ))}
          
          {/* 保存按钮 */}
          <View className="p-4">
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              className="bg-primary py-4 rounded-lg items-center"
            >
              <Text className="text-white font-semibold text-base">保存权限</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
