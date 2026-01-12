import { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/use-auth";
import { useStore, clearAllDecks } from "@/data/store";
import { clearDatabase } from "@/data/database";
import { exportDecksOffline } from "@/data/api";
import { useSyncStatus } from "@/providers/sync-provider";
import { getStreakData } from "@/data/queries";
import {
  getNotificationPreferences,
  scheduleStreakReminder,
  cancelStreakReminder,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "@/services/notifications";
import { router } from "expo-router";

type SettingItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
  isLoading?: boolean;
};

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  isDestructive,
  isLoading,
}: SettingItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        pressed && onPress && styles.settingItemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.settingIconContainer,
            isDestructive && styles.settingIconDestructive,
          ]}
        >
          <Text style={styles.settingIcon}>{icon}</Text>
        </View>
        <View style={styles.settingTextContainer}>
          <Text
            style={[
              styles.settingTitle,
              isDestructive && styles.settingTitleDestructive,
            ]}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color="#667eea" />
      ) : (
        rightElement ||
        (onPress && <Text style={styles.settingChevron}>›</Text>)
      )}
    </Pressable>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen() {
  const { isSignedIn, user, signOut, deleteAccount } = useAuth();
  const { isSyncing, lastSyncAt, exportToCloud, importFromCloud } = useSyncStatus();
  const decks = useStore(useCallback((s) => s.decks, []));
  const [dailyReminder, setDailyReminder] = useState(false);
  const [streakReminder, setStreakReminder] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load notification preferences and streak data on mount
  useEffect(() => {
    async function loadData() {
      // Load notification preferences
      try {
        const prefs = await getNotificationPreferences();
        setStreakReminder(prefs.streakReminder);
        setDailyReminder(prefs.dailyReminder);
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      }

      // Load streak data
      try {
        const streakData = await getStreakData();
        if (streakData) {
          setCurrentStreak(streakData.current_streak);
        }
      } catch (error) {
        console.error("Failed to load streak data:", error);
      }
    }

    loadData();
  }, []);

  // Handle streak reminder toggle
  const handleStreakReminderChange = async (value: boolean) => {
    setStreakReminder(value);
    try {
      if (value) {
        const success = await scheduleStreakReminder();
        if (!success) {
          setStreakReminder(false);
          Alert.alert("Мэдэгдэл", "Мэдэгдэл илгээх зөвшөөрөл олгоно уу.");
        }
      } else {
        await cancelStreakReminder();
      }
    } catch (error) {
      console.error("Failed to toggle streak reminder:", error);
      setStreakReminder(!value);
    }
  };

  // Handle daily reminder toggle
  const handleDailyReminderChange = async (value: boolean) => {
    setDailyReminder(value);
    try {
      if (value) {
        const success = await scheduleDailyReminder(20, 0);
        if (!success) {
          setDailyReminder(false);
          Alert.alert("Мэдэгдэл", "Мэдэгдэл илгээх зөвшөөрөл олгоно уу.");
        }
      } else {
        await cancelDailyReminder();
      }
    } catch (error) {
      console.error("Failed to toggle daily reminder:", error);
      setDailyReminder(!value);
    }
  };

  // Calculate stats
  const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  const totalDecks = decks.length;

  // Get user initials for avatar
  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "WG";

  const handleExportToCloud = async () => {
    if (!isSignedIn) {
      Alert.alert("Нэвтрээгүй байна", "Cloud руу хадгалахын тулд нэвтэрнэ үү.");
      return;
    }

    try {
      const result = await exportToCloud();
      if (result.success) {
        Alert.alert("Амжилттай", "Таны өгөгдөл cloud-д хадгалагдлаа.");
      } else {
        Alert.alert("Алдаа", result.error || "Хадгалахад алдаа гарлаа.");
      }
    } catch {
      Alert.alert("Алдаа", "Хадгалахад алдаа гарлаа.");
    }
  };

  const handleImportFromCloud = async () => {
    if (!isSignedIn) {
      Alert.alert("Нэвтрээгүй байна", "Cloud-оос татахын тулд нэвтэрнэ үү.");
      return;
    }

    Alert.alert(
      "Cloud-оос татах",
      "Cloud дээрх өгөгдлөөр орлуулах уу? Одоогийн өгөгдөл устах болно.",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Татах",
          onPress: async () => {
            setIsImporting(true);
            try {
              const result = await importFromCloud();
              if (result.success) {
                Alert.alert(
                  "Амжилттай",
                  `${result.decks.length} deck татагдлаа.`
                );
              } else {
                Alert.alert("Алдаа", result.error || "Татахад алдаа гарлаа.");
              }
            } catch {
              Alert.alert("Алдаа", "Татахад алдаа гарлаа.");
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  // Format last sync time
  const getLastSyncText = () => {
    if (!lastSyncAt) return "Sync хийгээгүй";
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Саяхан";
    if (diffMins < 60) return `${diffMins} мин өмнө`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} цаг өмнө`;
    return date.toLocaleDateString();
  };

  const handleExport = async () => {
    if (decks.length === 0) {
      Alert.alert("Хоосон", "Export хийх deck байхгүй байна.");
      return;
    }

    setIsExporting(true);
    try {
      const jsonData = exportDecksOffline(decks);
      await Share.share({
        message: jsonData,
        title: "WordGym Backup",
      });
    } catch (error) {
      if ((error as Error).message !== "User did not share") {
        Alert.alert("Алдаа", "Export хийхэд алдаа гарлаа.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      "Импорт",
      "JSON файлаа clipboard-д хуулаад дахин оролдоно уу. (Coming soon)"
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Өгөгдөл устгах",
      "Бүх deck болон card-ууд устах болно. Үргэлжлүүлэх үү?",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearDatabase();
              clearAllDecks();
              Alert.alert("Амжилттай", "Бүх өгөгдөл устгагдлаа.");
            } catch {
              Alert.alert("Алдаа", "Өгөгдөл устгахад алдаа гарлаа.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Гарах", "Та системээс гарахдаа итгэлтэй байна уу?", [
      { text: "Болих", style: "cancel" },
      {
        text: "Гарах",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Бүртгэл устгах",
      "Таны бүртгэл болон бүх өгөгдөл бүрмөсөн устах болно. Үргэлжлүүлэх үү?",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: async () => {
            const success = await deleteAccount();
            if (success) {
              Alert.alert("Амжилттай", "Таны бүртгэл устгагдлаа.");
            } else {
              Alert.alert("Алдаа", "Бүртгэл устгахад алдаа гарлаа.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0f", "#12121a", "#0a0a0f"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.orbContainer}>
        <LinearGradient
          colors={["rgba(102, 126, 234, 0.12)", "transparent"]}
          style={[styles.orb, styles.orbTopRight]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Апп-ын тохиргоо болон мэдээлэл</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <Pressable
            style={({ pressed }) => [
              styles.profileCard,
              pressed && styles.profileCardPressed,
            ]}
            onPress={() => {
              router.push("/(auth)/sign-in");
            }}
          >
            <LinearGradient
              colors={["rgba(102, 126, 234, 0.15)", "rgba(79, 172, 254, 0.08)"]}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={["#a2cce8ff", "#3c67f4ff"]}
                style={styles.profileAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.profileAvatarText}>{userInitials}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {isSignedIn
                    ? user?.fullName || user?.primaryEmailAddress?.emailAddress
                    : "Нэвтрэх"}
                </Text>
                <View style={styles.profileStats}>
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>{totalDecks}</Text>
                    <Text style={styles.profileStatLabel}>deck</Text>
                  </View>
                  <View style={styles.profileStatDivider} />
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>{totalCards}</Text>
                    <Text style={styles.profileStatLabel}>card</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.profileChevron}>›</Text>
            </LinearGradient>
          </Pressable>

          {/* Cloud Sync */}
          {isSignedIn && (
            <SettingSection title="Cloud Sync">
              <SettingItem
                icon="📤"
                title="Cloud руу хадгалах"
                subtitle={lastSyncAt ? getLastSyncText() : "Хадгалаагүй"}
                onPress={handleExportToCloud}
                isLoading={isSyncing}
              />
              <Divider />
              <SettingItem
                icon="📥"
                title="Cloud-оос татах"
                subtitle="Өгөгдлөө сэргээх"
                onPress={handleImportFromCloud}
                isLoading={isImporting}
              />
            </SettingSection>
          )}

          {/* Study Settings */}
          <SettingSection title="Learning">
            <SettingItem
              icon="🎯"
              title="Daily goal"
              subtitle="10 card / өдөрт"
              onPress={() => {}}
            />
            <Divider />
            <SettingItem
              icon="💬"
              title="Quiz Length"
              subtitle="5-10 quiz"
              onPress={() => {}}
            />
          </SettingSection>

          {/* Notifications */}
          <SettingSection title="Notifications">
            <SettingItem
              icon="🔔"
              title="Streak Reminder"
              subtitle="Өдөр бүр 20:00-д сануулга"
              rightElement={
                <Switch
                  value={streakReminder}
                  onValueChange={handleStreakReminderChange}
                  trackColor={{ false: "#2a2a35", true: "#667eea" }}
                  thumbColor="#ffffff"
                />
              }
            />
            <Divider />
            <SettingItem
              icon="⏰"
              title="Daily Reminder"
              subtitle="Давтлага хийх сануулга"
              rightElement={
                <Switch
                  value={dailyReminder}
                  onValueChange={handleDailyReminderChange}
                  trackColor={{ false: "#2a2a35", true: "#667eea" }}
                  thumbColor="#ffffff"
                />
              }
            />
          </SettingSection>

          {/* Appearance*/}
          <SettingSection title="Appearance">
            <SettingItem
              icon="🎨"
              title="Theme"
              subtitle="Харанхуй"
              onPress={() => {}}
            />
            <Divider />
            <SettingItem
              icon="🌐"
              title="Хэл"
              subtitle="Монгол"
              onPress={() => {}}
            />
          </SettingSection>

          {/* Data */}
          <SettingSection title="Өгөгдөл">
            <SettingItem
              icon="📤"
              title="Экспорт"
              subtitle="Deck-үүдээ хадгалах"
              onPress={handleExport}
              isLoading={isExporting}
            />
            <Divider />
            <SettingItem
              icon="📥"
              title="Импорт"
              subtitle="Deck оруулах"
              onPress={handleImport}
            />
            <Divider />
            <SettingItem
              icon="🗑️"
              title="Бүх өгөгдлийг устгах"
              onPress={handleClearData}
              isDestructive
              isLoading={isClearing}
            />
          </SettingSection>

          {/* About */}
          <SettingSection title="About">
            <SettingItem icon="⭐" title="Үнэлгээ өгөх" onPress={() => {}} />
            <Divider />
            <SettingItem icon="🔥" title="Current Streak" subtitle={`${currentStreak} өдөр`} />
            <Divider />
          </SettingSection>

          {/* Account */}
          {isSignedIn && (
            <SettingSection title="Account">
              <SettingItem icon="🚪" title="Гарах" onPress={handleSignOut} />
              <Divider />
              <SettingItem
                icon="⚠️"
                title="Бүртгэл устгах"
                onPress={handleDeleteAccount}
                isDestructive
              />
            </SettingSection>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <LinearGradient
              colors={["#a2cce8ff", "#3c67f4ff"]}
              style={styles.footerLogo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.footerLogoText}>WG</Text>
            </LinearGradient>
            <View>
              <Text style={styles.footerAppName}>WordGym</Text>
              <Text style={styles.footerCopyright}>
                Made with ❤️ in Mongolia
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  orbTopRight: {
    top: -150,
    right: -150,
  },
  screen: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  title: {
    color: "#f5f5f7",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#6b6b78",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  profileCard: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  profileGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.25)",
    borderRadius: 20,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  profileStatValue: {
    color: "#8b9eff",
    fontSize: 16,
    fontWeight: "700",
  },
  profileStatLabel: {
    color: "#6b6b78",
    fontSize: 13,
  },
  profileStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 12,
  },
  profileChevron: {
    color: "#8b9eff",
    fontSize: 26,
    fontWeight: "300",
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#6b6b78",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingItemPressed: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  settingIconDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  settingIcon: {
    fontSize: 18,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: "#f5f5f7",
    fontSize: 16,
    fontWeight: "500",
  },
  settingTitleDestructive: {
    color: "#ef4444",
  },
  settingSubtitle: {
    color: "#6b6b78",
    fontSize: 13,
    marginTop: 2,
  },
  settingChevron: {
    color: "#505060",
    fontSize: 24,
    fontWeight: "300",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginLeft: 68,
  },

  footer: {
    paddingTop: 10,
    paddingBottom: 60,
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  footerLogo: {
    width: 35,
    height: 35,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  footerLogoText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  footerAppName: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "700",
  },
  footerTagline: {
    color: "#6b6b78",
    fontSize: 13,
  },
  footerCopyright: {
    color: "#404050",
    fontSize: 12,
    marginTop: 4,
  },

  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncDotActive: {
    backgroundColor: "#667eea",
  },
  syncDotIdle: {
    backgroundColor: "#4ade80",
  },
  syncStatusText: {
    color: "#6b6b78",
    fontSize: 13,
  },
});
