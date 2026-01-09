import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export function TopBar({ currentIndex, total }) {
  const router = useRouter();
  const navScale = useRef(new Animated.Value(1)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const progressText = `${Math.min(currentIndex + 1, total)}/${Math.max(
    total,
    1
  )}`;

  return (
    <>
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          onPressIn={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.spring(navScale, {
              toValue: 1.2,
              damping: 2,
              stiffness: 200,
              useNativeDriver: true,
            }).start();

            Animated.timing(navOpacity, {
              toValue: 0.85,
              duration: 80,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(navScale, {
              toValue: 1,
              damping: 14,
              stiffness: 220,
              useNativeDriver: true,
            }).start();
            Animated.timing(navOpacity, {
              toValue: 1,
              duration: 120,
              useNativeDriver: true,
            }).start();
          }}
        >
          <Animated.View
            style={[
              styles.navBtn,
              { transform: [{ scale: navScale }], opacity: navOpacity },
            ]}
          >
            <Text style={styles.navBtnIcon}>✕</Text>
          </Animated.View>
        </Pressable>

        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>

        <View style={{ width: 36 }} />
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(
                8,
                (100 * (currentIndex + 1)) / Math.max(total, 1)
              )}%`,
            },
          ]}
        />
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  navBtnIcon: { color: "#F2F2F7", fontSize: 18, fontWeight: "800" },
  progressPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  progressText: { color: "rgba(242,242,247,0.70)", fontWeight: "800" },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(242,242,247,0.55)",
  },
});
