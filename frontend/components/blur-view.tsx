/**
 * Cross-platform BlurView component
 * Uses expo-blur on native and CSS backdrop-filter on web
 */

import { BlurView as ExpoBlurView, BlurViewProps } from "expo-blur";
import { Platform, View, ViewStyle } from "react-native";

type Props = BlurViewProps & {
  style?: ViewStyle | ViewStyle[];
};

export function BlurView({ intensity = 20, tint = "dark", style, children, ...props }: Props) {
  // On web, use CSS backdrop-filter for blur effect
  if (Platform.OS === "web") {
    const webStyle = {
      backdropFilter: `blur(${intensity * 0.5}px)`,
      WebkitBackdropFilter: `blur(${intensity * 0.5}px)`,
    } as ViewStyle;

    return (
      <View style={[webStyle, style]} {...props}>
        {children}
      </View>
    );
  }

  // On native (iOS/Android), use expo-blur
  return (
    <ExpoBlurView intensity={intensity} tint={tint} style={style} {...props}>
      {children}
    </ExpoBlurView>
  );
}
