import { useSignUp, useSSO } from "@clerk/clerk-expo";
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

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Алдаа", "И-мэйл болон нууц үгээ оруулна уу.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Алдаа", "Нууц үг таарахгүй байна.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Алдаа", "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      const clerkError = error as { errors?: { message: string }[] };
      const message = clerkError.errors?.[0]?.message || "Бүртгэлд алдаа гарлаа.";
      Alert.alert("Алдаа", message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, email, password, confirmPassword]);

  const handleVerification = useCallback(async () => {
    if (!isLoaded) return;

    if (!verificationCode.trim()) {
      Alert.alert("Алдаа", "Баталгаажуулах кодоо оруулна уу.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        console.log("Verification incomplete:", result);
        Alert.alert("Алдаа", "Баталгаажуулалт дуусаагүй байна.");
      }
    } catch (error: unknown) {
      console.error("Verification error:", error);
      const clerkError = error as { errors?: { message: string }[] };
      const message = clerkError.errors?.[0]?.message || "Баталгаажуулахад алдаа гарлаа.";
      Alert.alert("Алдаа", message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, setActive, verificationCode, router]);

  const handleGoogleSignUp = useCallback(async () => {
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
      console.error("Google sign up error:", error);
      Alert.alert("Алдаа", "Google-ээр бүртгүүлэхэд алдаа гарлаа.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isLoaded, startSSOFlow, router]);

  // Verification screen
  if (pendingVerification) {
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
            <View style={styles.verificationContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.verificationIcon}>📧</Text>
              </View>
              <Text style={styles.verificationTitle}>И-мэйл баталгаажуулах</Text>
              <Text style={styles.verificationText}>
                {email} хаяг руу баталгаажуулах код илгээлээ.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Баталгаажуулах код</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#6b6b78"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleVerification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Баталгаажуулах</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.backButton}
                onPress={() => setPendingVerification(false)}
              >
                <Text style={styles.backButtonText}>Буцах</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Бүртгүүлэх</Text>

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
                autoComplete="new-password"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Нууц үг давтах</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6b6b78"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Бүртгүүлэх</Text>
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
              onPress={handleGoogleSignUp}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#f5f5f7" />
              ) : (
                <>
                  <Text style={styles.oauthIcon}>G</Text>
                  <Text style={styles.oauthButtonText}>Google-ээр бүртгүүлэх</Text>
                </>
              )}
            </Pressable>

            {/* Sign In Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Бүртгэлтэй юу? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Нэвтрэх</Text>
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
    paddingTop: 32,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  appName: {
    color: "#f5f5f7",
    fontSize: 24,
    fontWeight: "700",
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
  // Verification styles
  verificationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  verificationIcon: {
    fontSize: 36,
  },
  verificationTitle: {
    color: "#f5f5f7",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  verificationText: {
    color: "#6b6b78",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#667eea",
    fontSize: 15,
    fontWeight: "600",
  },
});
