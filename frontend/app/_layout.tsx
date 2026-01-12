import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initDatabase } from "@/data/database";
import { loadDecksFromDatabase } from "@/data/store";
import { AuthProvider } from "@/providers/clerk-provider";
import { SyncProvider } from "@/providers/sync-provider";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log("Initializing WordGym app...");

        // Initialize database
        await initDatabase();

        // Load decks from database into store
        await loadDecksFromDatabase();

        console.log("App initialization complete");
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        // Still set ready to true to prevent infinite loading
        setIsReady(true);
      }
    }

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SyncProvider>
          <Stack initialRouteName="(tabs)">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
                presentation: "modal",
              }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="deck" options={{ headerShown: false }} />
            <Stack.Screen name="study" options={{ headerShown: false }} />
            <Stack.Screen name="streak" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
        </SyncProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0f",
  },
});
