import { useState } from "react";
import { View, Text, ScrollView, Switch, Alert } from "react-native";
import { Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

/**
 * 权限配置页面
 * 
 * 功能：
 * 1. 显示所有功能模块的权限开关
 * 2. 配置哪些功能对普通成员开放
 * 3. 保存权限配置
 */
export default function PermissionConfigScreen() {
  const colors = useColors();
  
  const [permissions, setPermissions] = useState({
    // 基础资料
    warehouseView: true,
    warehouseEdit: false,
    materialView: true,
    materialEdit: false,
    bomView: true,
    bomEdit: false,
    
    // 库存操作
    stockIn: true,
    stockOut: true,
    stockTransfer: false,
    stockCheck: false,
    bomIssue: false,
    stockReturn: true,
    stockExchange: true,
    stockAdjustment: false,
    
    // 审批权限
    approvalConfig: false,
    approvalApprove: false,
    
    // 记录查询
    recordDoc: true,
    recordLedger: true,
    recordApproval: false,
    
    // 团队管理
    teamMember: false,
    teamPermission: false,
  });
  
  const handleToggle = (key: keyof typeof permissions) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const permissionGroups = [
    {
      title: "基础资料",
      items: [
        { key: "warehouseView" as const, label: "查看仓库", description: "允许查看仓库列表和详情" },
        { key: "warehouseEdit" as const, label: "编辑仓库", description: "允许创建、编辑、删除仓库" },
        { key: "materialView" as const, label: "查看材料", description: "允许查看材料列表和详情" },
        { key: "materialEdit" as const, label: "编辑材料", description: "允许创建、编辑、删除材料" },
        { key: "bomView" as const, label: "查看BOM", description: "允许查看BOM列表和详情" },
        { key: "bomEdit" as const, label: "编辑BOM", description: "允许创建、编辑、删除BOM" },
      ],
    },
    {
      title: "库存操作",
      items: [
        { key: "stockIn" as const, label: "入库", description: "允许创建入库单" },
        { key: "stockOut" as const, label: "出库", description: "允许创建出库单" },
        { key: "stockTransfer" as const, label: "调拨", description: "允许创建调拨单" },
        { key: "stockCheck" as const, label: "盘点", description: "允许创建盘点单" },
        { key: "bomIssue" as const, label: "BOM发料", description: "允许创建BOM发料单" },
        { key: "stockReturn" as const, label: "退仓", description: "允许创建退仓单" },
        { key: "stockExchange" as const, label: "换料", description: "允许创建换料单" },
        { key: "stockAdjustment" as const, label: "平账", description: "允许创建平账单" },
      ],
    },
    {
      title: "审批权限",
      items: [
        { key: "approvalConfig" as const, label: "审批配置", description: "允许配置审批流程和审批人" },
        { key: "approvalApprove" as const, label: "审批单据", description: "允许审批或驳回单据" },
      ],
    },
    {
      title: "记录查询",
      items: [
        { key: "recordDoc" as const, label: "查看单据记录", description: "允许查看所有单据记录" },
        { key: "recordLedger" as const, label: "查看材料流水", description: "允许查看材料流水记录" },
        { key: "recordApproval" as const, label: "查看审批记录", description: "允许查看审批记录" },
      ],
    },
    {
      title: "团队管理",
      items: [
        { key: "teamMember" as const, label: "成员管理", description: "允许邀请、编辑、删除成员" },
        { key: "teamPermission" as const, label: "权限管理", description: "允许编辑成员权限" },
      ],
    },
  ];
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "权限配置",
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ScrollView className="flex-1">
          <View className="p-4">
            <View className="bg-warning/10 p-3 rounded-lg mb-4">
              <Text className="text-warning text-sm">
                ⚠️ 这些权限配置将应用于所有普通成员，管理员始终拥有所有权限
              </Text>
            </View>
          </View>
          
          {permissionGroups.map((group, groupIndex) => (
            <View key={groupIndex} className="mb-4">
              <View className="bg-surface/50 px-4 py-2">
                <Text className="text-sm font-semibold text-foreground">
                  {group.title}
                </Text>
              </View>
              
              {group.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  className={`bg-surface px-4 py-3 flex-row justify-between items-center ${
                    itemIndex < group.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-sm font-medium text-foreground mb-1">
                      {item.label}
                    </Text>
                    <Text className="text-xs text-muted">
                      {item.description}
                    </Text>
                  </View>
                  
                  <Switch
                    value={permissions[item.key]}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
