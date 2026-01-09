import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Congrats({ setCurrentIndex }) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.emptyWrap}>
        <Text style={styles.congratsTitle}>Congratulations!</Text>
        <Text style={styles.congratsSubtitle}>
          Та энэ deck-ийн бүх card-аа дуусгалаа.
        </Text>
        <View style={styles.actionRow}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => setCurrentIndex(0)}
          >
            <Text style={styles.primaryBtnText}>Дахин эхлэх</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Буцах</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 14, backgroundColor: "transparent" },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryBtn: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  primaryBtnText: { color: "#F2F2F7", fontSize: 14, fontWeight: "900" },

  congratsTitle: { color: "#F2F2F7", fontSize: 24, fontWeight: "900" },
  congratsSubtitle: { color: "#B8BAC2", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  secondaryBtnText: { color: "#C6C8D0", fontSize: 14, fontWeight: "700" },
});
