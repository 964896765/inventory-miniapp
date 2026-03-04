import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, Share, Platform, Linking } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api";

type StatSummary = {
  todayInCount: number;
  todayInQty: number;
  todayOutCount: number;
  todayOutQty: number;
  pendingApprovals?: number;
  unreadNotifications?: number;
};

type GridItem = {
  key: string;
  label: string;
  // SF Symbols string name (iOS native) mapped to MaterialIcons on Android/Web.
  icon: string;
  onPress: () => void;
};

function SectionHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {right}
    </View>
  );
}

function Grid({ items }: { items: GridItem[] }) {
  // 4 columns
  return (
    <View className="flex-row flex-wrap">
      {items.map((it) => (
        <Pressable
          key={it.key}
          className="w-1/4 items-center mb-4"
          onPress={it.onPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View className="w-14 h-14 rounded-2xl bg-surface items-center justify-center border border-border">
            <IconSymbol size={28} name={it.icon} color={"#5B7FC7"} />
          </View>
          <Text className="text-sm text-foreground mt-2">{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();

  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<StatSummary>({
    todayInCount: 0,
    todayInQty: 0,
    todayOutCount: 0,
    todayOutQty: 0,
    pendingApprovals: 0,
    unreadNotifications: 0,
  });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.statistics.getSummary();
      setSummary({
        todayInCount: res.todayInCount ?? 0,
        todayInQty: res.todayInQty ?? 0,
        todayOutCount: res.todayOutCount ?? 0,
        todayOutQty: res.todayOutQty ?? 0,
        pendingApprovals: res.pendingApprovals ?? 0,
        unreadNotifications: res.unreadNotifications ?? 0,
      });
    } catch {
      // keep zeros
    }
  }, []);

  useEffect(() => {
    fetchSummary().catch(() => {});
  }, [fetchSummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

  const haptic = async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  const handleShareToWeChat = useCallback(async () => {
    await haptic();

    // 生成可追踪链接（后端返回 shareId + url）
    const { shareId, url } = await api.share.createLink({ scene: "home_bottom_share" });

    try {
      const result = await Share.share({
        title: "库存管理工具",
        message: `库存管理工具分享链接：${url}`,
        url,
      });

      const action =
        (result as any)?.action === Share.sharedAction
          ? "success"
          : (result as any)?.action === Share.dismissedAction
          ? "dismiss"
          : "unknown";

      await api.share.log({
        shareId,
        platform: Platform.OS,
        result: action,
      });
    } catch (e: any) {
      await api.share.log({
        shareId,
        platform: Platform.OS,
        result: "fail",
        errorMsg: String(e?.message || e),
      });
      throw e;
    }
  }, []);

  const openDesktop = useCallback(async () => {
    await haptic();
    // 你可以在后端配置一个PC端地址
    const url = (await api.misc.getDesktopUrl()).url || "https://example.com";
    Linking.openURL(url).catch(() => {});
  }, []);

  const openSupport = useCallback(async () => {
    await haptic();
    // 后端可返回客服URL或客服联系方式
    const { url } = await api.misc.getSupportUrl();
    if (url) Linking.openURL(url).catch(() => {});
  }, []);

  const actions = useMemo<GridItem[]>(
    () => [
      { key: "stock_in", label: "入库", icon: "tray.and.arrow.down.fill", onPress: async () => { await haptic(); router.push("/operations/stock-in"); } },
      { key: "stock_out", label: "出库", icon: "tray.and.arrow.up.fill", onPress: async () => { await haptic(); router.push("/operations/stock-out"); } },
      { key: "transfer", label: "调拨", icon: "arrow.left.arrow.right.square.fill", onPress: async () => { await haptic(); router.push("/operations/transfer"); } },
      { key: "inventory_check", label: "盘点", icon: "doc.text.magnifyingglass", onPress: async () => { await haptic(); router.push("/operations/inventory-check"); } },
    ],
    []
  );

  const records = useMemo<GridItem[]>(
    () => [
      { key: "in_doc", label: "入库单", icon: "doc.text.fill", onPress: async () => { await haptic(); router.push("/docs?type=stock_in"); } },
      { key: "out_doc", label: "出库单", icon: "doc.text.fill", onPress: async () => { await haptic(); router.push("/docs?type=stock_out"); } },
      { key: "transfer_doc", label: "调拨单", icon: "doc.text.fill", onPress: async () => { await haptic(); router.push("/docs?type=transfer"); } },
      { key: "check_doc", label: "盘点单", icon: "doc.text.fill", onPress: async () => { await haptic(); router.push("/docs?type=inventory_check"); } },
    ],
    []
  );

  const inventory = useMemo<GridItem[]>(
    () => [
      { key: "inv_query", label: "库存查询", icon: "shippingbox.fill", onPress: async () => { await haptic(); router.push("/inventory"); } },
      { key: "inv_warn", label: "库存预警", icon: "exclamationmark.triangle.fill", onPress: async () => { await haptic(); router.push("/inventory/warnings"); } },
      { key: "exp_warn", label: "过期预警", icon: "clock.fill", onPress: async () => { await haptic(); router.push("/inventory/expiry-warnings"); } },
      { key: "stats", label: "统计分析", icon: "chart.bar.fill", onPress: async () => { await haptic(); router.push("/(tabs)/workspace"); } },
    ],
    []
  );

  const basics = useMemo<GridItem[]>(
    () => [
      { key: "wh", label: "仓库管理", icon: "house.fill", onPress: async () => { await haptic(); router.push("/warehouses"); } },
      { key: "cat", label: "材料分类", icon: "square.grid.2x2.fill", onPress: async () => { await haptic(); router.push("/categories"); } },
      { key: "mat", label: "材料管理", icon: "cube.box.fill", onPress: async () => { await haptic(); router.push("/materials"); } },
      { key: "su", label: "供需单位", icon: "person.2.fill", onPress: async () => { await haptic(); router.push("/supply-units"); } },
      { key: "bom", label: "BOM管理", icon: "list.bullet.rectangle.portrait.fill", onPress: async () => { await haptic(); router.push("/bom"); } },
    ],
    []
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      >
        {/* 今日统计卡片 */}
        <View className="px-4 pt-4">
          <View className="bg-surface rounded-2xl border border-border p-4">
            <Text className="text-base font-semibold text-foreground mb-3">今日统计</Text>
            <View className="flex-row">
              <Pressable
                className="flex-1"
                onPress={async () => { await haptic(); router.push('/docs?type=stock_in&range=today'); }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-sm font-semibold" style={{ color: "#5B7FC7" }}>今日入库 &gt;</Text>
                <Text className="text-xs text-muted mt-1">
                  笔数：<Text className="text-foreground">{summary.todayInCount}</Text>　数量：<Text className="text-foreground">{summary.todayInQty}</Text>
                </Text>
              </Pressable>
              <View className="w-px bg-border mx-3" />
              <Pressable
                className="flex-1"
                onPress={async () => { await haptic(); router.push('/docs?type=stock_out&range=today'); }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-sm font-semibold" style={{ color: "#5B7FC7" }}>今日出库 &gt;</Text>
                <Text className="text-xs text-muted mt-1">
                  笔数：<Text className="text-foreground">{summary.todayOutCount}</Text>　数量：<Text className="text-foreground">{summary.todayOutQty}</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 操作 */}
        <View className="px-4 mt-4">
          <View className="bg-surface rounded-2xl border border-border p-4">
            <SectionHeader
              title="操作"
              right={
                <View className="flex-row items-center gap-3">
                  <Pressable onPress={async () => { await haptic(); router.push("/approval"); }} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <Text className="text-sm font-semibold" style={{ color: "#5B7FC7" }}>
                      待审批{summary.pendingApprovals ? `(${summary.pendingApprovals})` : ""} &gt;
                    </Text>
                  </Pressable>
                  <Pressable onPress={async () => { await haptic(); router.push("/notifications"); }} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <Text className="text-sm font-semibold" style={{ color: "#5B7FC7" }}>
                      消息通知{summary.unreadNotifications ? `(${summary.unreadNotifications})` : ""} &gt;
                    </Text>
                  </Pressable>
                </View>
              }
            />
            <Grid items={actions} />
          </View>
        </View>

        {/* 记录 */}
        <View className="px-4 mt-4">
          <View className="bg-surface rounded-2xl border border-border p-4">
            <SectionHeader
              title="记录"
              right={
                <Pressable onPress={async () => { await haptic(); router.push("/records/my"); }} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <Text className="text-sm font-semibold" style={{ color: "#5B7FC7" }}>我的记录 &gt;</Text>
                </Pressable>
              }
            />
            <Grid items={records} />
          </View>
        </View>

        {/* 库存 */}
        <View className="px-4 mt-4">
          <View className="bg-surface rounded-2xl border border-border p-4">
            <SectionHeader title="库存" />
            <Grid items={inventory} />
          </View>
        </View>

        {/* 基础数据设置 */}
        <View className="px-4 mt-4">
          <View className="bg-surface rounded-2xl border border-border p-4">
            <SectionHeader title="基础数据设置" />
            <Grid items={basics} />
          </View>
        </View>

        {/* 底部功能区 */}
        <View className="px-4 mt-4">
          <View className="bg-surface rounded-2xl border border-border p-4">
            <View className="flex-row">
              <Pressable className="flex-1 items-center" onPress={handleShareToWeChat} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <IconSymbol size={20} name="arrowshape.turn.up.right.fill" color={"#5B7FC7"} />
                </View>
                <Text className="text-sm text-foreground mt-2">分享给好友</Text>
              </Pressable>

              <Pressable className="flex-1 items-center" onPress={openDesktop} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <IconSymbol size={20} name="desktopcomputer" color={"#5B7FC7"} />
                </View>
                <Text className="text-sm text-foreground mt-2">电脑版</Text>
              </Pressable>

              <Pressable className="flex-1 items-center" onPress={openSupport} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <IconSymbol size={20} name="headphones" color={"#5B7FC7"} />
                </View>
                <Text className="text-sm text-foreground mt-2">在线客服</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
