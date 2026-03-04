import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function ExpiryWarningsScreen() {
  return (
    <ScreenContainer className="bg-background">
      <View className="px-4 pt-10">
        <Text className="text-2xl font-bold text-foreground">过期预警</Text>
        <Text className="text-sm text-muted mt-2">后端需实现 /api/inventory/expiry-warnings</Text>
      </View>
    </ScreenContainer>
  );
}
