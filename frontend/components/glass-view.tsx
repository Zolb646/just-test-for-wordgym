import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "./blur-view";

type Variant = "surface" | "ghost";

export function GlassView({
  children,
  style,
  variant = "surface",
  intensity,
  tint = "dark",
}: {
  children?: React.ReactNode;
  style?: any;
  variant?: Variant;
  intensity?: number;
  tint?: "light" | "dark" | "default";
}) {
  const isSurface = variant === "surface";

  return (
    <BlurView
      intensity={intensity ?? (Platform.OS === "ios" ? 28 : 18)}
      tint={tint}
      style={[styles.base, isSurface ? styles.surface : styles.ghost, style]}
    >
      {/* subtle liquid fill */}
      <View
        pointerEvents="none"
        style={isSurface ? styles.fill : styles.fillGhost}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  surface: {
    backgroundColor: "rgba(16,16,20,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  fillGhost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});
