import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

// Required for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Алдаа", "И-мэйл болон нууц үгээ оруулна уу.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        console.log("Sign in incomplete:", result);
        Alert.alert("Алдаа", "Нэвтрэлт дуусаагүй байна.");
      }
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      const clerkError = error as { errors?: { message: string }[] };
      const message = clerkError.errors?.[0]?.message || "Нэвтрэхэд алдаа гарлаа.";
      Alert.alert("Алдаа", message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn, setActive, email, password, router]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    setIsGoogleLoading(true);
    try {
      const { createdSessionId, setActive: setActiveSession } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: "exp://localhost:8081/--/oauth-callback",
      });

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      Alert.alert("Алдаа", "Google-ээр нэвтрэхэд алдаа гарлаа.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isLoaded, startSSOFlow, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#a2cce8", "#3c67f4"]}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>WG</Text>
            </LinearGradient>
            <Text style={styles.appName}>WordGym</Text>
            <Text style={styles.tagline}>Үг цээжлэх хамгийн хялбар арга</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Нэвтрэх</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>И-мэйл</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#6b6b78"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Нууц үг</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6b6b78"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Нэвтрэх</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>эсвэл</Text>
              <View style={styles.divider} />
            </View>

            {/* OAuth Buttons */}
            <Pressable
              style={({ pressed }) => [
                styles.oauthButton,
                pressed && styles.buttonPressed,
                isGoogleLoading && styles.buttonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#f5f5f7" />
              ) : (
                <>
                  <Text style={styles.oauthIcon}>G</Text>
                  <Text style={styles.oauthButtonText}>Google-ээр нэвтрэх</Text>
                </>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Бүртгэл байхгүй юу? </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Бүртгүүлэх</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  appName: {
    color: "#f5f5f7",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  tagline: {
    color: "#6b6b78",
    fontSize: 14,
    fontWeight: "500",
  },
  form: {
    flex: 1,
  },
  title: {
    color: "#f5f5f7",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: "#a0a0a8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#f5f5f7",
  },
  primaryButton: {
    backgroundColor: "#667eea",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "#6b6b78",
    fontSize: 13,
    fontWeight: "500",
    marginHorizontal: 16,
  },
  oauthButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  oauthIcon: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "700",
  },
  oauthButtonText: {
    color: "#f5f5f7",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#6b6b78",
    fontSize: 14,
  },
  footerLink: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
});
