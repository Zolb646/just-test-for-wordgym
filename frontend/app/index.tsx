import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Always go to home - let users use the app without signing in
    router.replace("/(tabs)/home");
  }, [isLoaded, router]);

  // Show loading while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0f",
  },
});
