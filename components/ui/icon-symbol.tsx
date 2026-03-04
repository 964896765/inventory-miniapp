// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
type IconMapping = Record<string, MaterialIconName>;

// Allow passing any SF Symbols string name from the UI.
// On Android/Web we map to MaterialIcons and fall back safely.
export type IconSymbolName = SymbolViewProps["name"] | string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "square.grid.2x2.fill": "dashboard",
  "person.fill": "person",
  "chevron.left": "chevron-left",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "plus": "add",
  "doc.text.fill": "description",

  // Home page grid (SF Symbols -> MaterialIcons)
  "tray.and.arrow.down.fill": "file-download",
  "tray.and.arrow.up.fill": "file-upload",
  "arrow.left.arrow.right.square.fill": "swap-horiz",
  "doc.text.magnifyingglass": "find-in-page",
  // MaterialIcons uses kebab/word names; `inventory_2` is not valid here.
  "shippingbox.fill": "inventory",
  "exclamationmark.triangle.fill": "warning",
  "clock.fill": "schedule",
  "chart.bar.fill": "bar-chart",
  "cube.box.fill": "inventory",
  "person.2.fill": "groups",
  "list.bullet.rectangle.portrait.fill": "list-alt",

  // Common UI
  magnifyingglass: "search",
  "xmark.circle.fill": "cancel",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mapped = MAPPING[String(name)] || ("help-outline" as MaterialIconName);
  return <MaterialIcons color={color} size={size} name={mapped} style={style} />;
}
