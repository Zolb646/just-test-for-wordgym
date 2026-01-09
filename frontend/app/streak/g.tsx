import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassView } from "@/components/glass-view";
import { useEffect, useState } from "react";
import { getStreakData, getWeeklyActivity } from "@/data/queries";
import { StreakDataRow } from "@/data/schema";

function getWeekDayLabels(): string[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push(days[date.getDay()]);
  }
  return result;
}

function getAchievementProgress(currentStreak: number, target: number): { completed: boolean; progress: number; remaining: number } {
  if (currentStreak >= target) {
    return { completed: true, progress: 100, remaining: 0 };
  }
  return {
    completed: false,
    progress: Math.round((currentStreak / target) * 100),
    remaining: target - currentStreak,
  };
}

export default function StreakScreen() {
  const router = useRouter();
  const [streakData, setStreakData] = useState<StreakDataRow | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  async function loadStreakData() {
    try {
      const streak = await getStreakData();
      const weekly = await getWeeklyActivity();
      setStreakData(streak);
      setWeeklyActivity(weekly);
    } catch (error) {
      console.error("Failed to load streak data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const currentStreak = streakData?.current_streak || 0;
  const bestStreak = streakData?.best_streak || 0;

  // Get weekday labels starting from 7 days ago
  const weekDays = getWeekDayLabels();
  const activeDays = weeklyActivity;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#4facfe" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0B0B0F", "#0F0F15", "#0B0B0F"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.screen} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && styles.navBtnPressed,
            ]}
            hitSlop={12}
          >
            <Text style={styles.navBtnIcon}>‹</Text>
          </Pressable>

          <Text style={styles.navTitle}>STREAK</Text>

          <View style={styles.navBtn} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <GlassView style={styles.statCard} variant="surface" intensity={16}>
              <View style={styles.row}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{currentStreak}</Text>
              </View>
              <Text style={styles.statLabel}>Days streak</Text>
            </GlassView>

            <GlassView style={styles.statCard} variant="surface" intensity={16}>
              <View style={styles.row}>
                <Text style={styles.statIcon}>🏆</Text>
                <Text style={styles.statValue}>{bestStreak}</Text>
              </View>
              <Text style={styles.statLabel}>Longest streak</Text>
            </GlassView>
          </View>

          {/* Weekly Calendar */}
          <GlassView style={styles.card} variant="surface" intensity={16}>
            <View style={styles.daysRow}>
              {weekDays.map((day, index) => (
                <View key={`${day}-${index}`} style={styles.dayColumn}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View
                    style={[
                      styles.dayBox,
                      activeDays[index] ? styles.dayActive : styles.dayInactive,
                    ]}
                  >
                    {activeDays[index] ? (
                      <Text style={styles.dayCheck}>✓</Text>
                    ) : (
                      <Text style={styles.dayEmpty}>-</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>{" "}
          </GlassView>

          {/* Achievements */}
          <GlassView style={styles.card} variant="surface" intensity={16}>
            <Text style={styles.sectionTitle}>Амжилтууд</Text>

            <View style={styles.achievementList}>
              {(() => {
                const bronze = getAchievementProgress(currentStreak, 7);
                return (
                  <View style={styles.achievementRow}>
                    <LinearGradient
                      colors={["#CD7F32", "#B87333"]}
                      style={styles.achievementBadge}
                    >
                      <Text style={styles.badgeText}>🥉</Text>
                    </LinearGradient>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>7 өдрийн streak</Text>
                      <Text style={styles.achievementDesc}>
                        {bronze.completed ? "Эхлэлээ тавьсанд баярлалаа!" : `${bronze.remaining} өдөр үлдсэн`}
                      </Text>
                    </View>
                    {bronze.completed ? (
                      <Text style={styles.achievementStatus}>✓</Text>
                    ) : (
                      <Text style={styles.achievementProgress}>{bronze.progress}%</Text>
                    )}
                  </View>
                );
              })()}

              <View style={styles.divider} />

              {(() => {
                const silver = getAchievementProgress(currentStreak, 14);
                return (
                  <View style={styles.achievementRow}>
                    <LinearGradient
                      colors={["#C0C0C0", "#A8A8A8"]}
                      style={styles.achievementBadge}
                    >
                      <Text style={styles.badgeText}>🥈</Text>
                    </LinearGradient>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>14 өдрийн streak</Text>
                      <Text style={styles.achievementDesc}>
                        {silver.completed ? "Тэвчээртэй байна!" : `${silver.remaining} өдөр үлдсэн`}
                      </Text>
                    </View>
                    {silver.completed ? (
                      <Text style={styles.achievementStatus}>✓</Text>
                    ) : (
                      <Text style={styles.achievementProgress}>{silver.progress}%</Text>
                    )}
                  </View>
                );
              })()}

              <View style={styles.divider} />

              {(() => {
                const gold = getAchievementProgress(currentStreak, 30);
                return (
                  <View style={styles.achievementRow}>
                    <LinearGradient
                      colors={["#FFD700", "#FFC107"]}
                      style={styles.achievementBadge}
                    >
                      <Text style={styles.badgeText}>🥇</Text>
                    </LinearGradient>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>30 өдрийн streak</Text>
                      <Text style={styles.achievementDesc}>
                        {gold.completed ? "Гайхалтай амжилт!" : `${gold.remaining} өдөр үлдсэн`}
                      </Text>
                    </View>
                    {gold.completed ? (
                      <Text style={styles.achievementStatus}>✓</Text>
                    ) : (
                      <Text style={styles.achievementProgress}>{gold.progress}%</Text>
                    )}
                  </View>
                );
              })()}
            </View>
          </GlassView>

          {/* Motivation Card */}
          <LinearGradient
            colors={["#212124ff", "#212124ff", "#212125ff"]}
            style={styles.motivationCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.motivationEmoji}>💪</Text>
            <Text style={styles.motivationText}>
              Өнөөдөр streak-ээ таслахгүй шүү!
            </Text>
            <Text style={styles.motivationSubtext}>
              Давтлага хийгээд өнөөдрийн зорилгоо биелүүл.
            </Text>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  navBtnPressed: { transform: [{ scale: 0.96 }], opacity: 0.92 },
  navBtnIcon: {
    color: "#F2F2F7",
    fontSize: 22,
    fontWeight: "700",
    marginTop: -2,
  },
  navTitle: {
    flex: 1,
    color: "#F2F2F7",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },

  // Hero Section
  streakHero: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  streakCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  streakNumber: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    marginTop: 4,
  },
  streakLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: -4,
  },
  streakEmoji: {
    fontSize: 32,
    marginTop: 16,
  },
  heroTitle: {
    color: "#F2F2F7",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  heroSubtitle: {
    color: "rgba(242,242,247,0.5)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  row: { flexDirection: "row", gap: 4 },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    color: "#F2F2F7",
    fontSize: 28,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(242,242,247,0.5)",
    fontSize: 12,
    fontWeight: "700",
  },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: "#F2F2F7",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },

  // Weekly Calendar
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    color: "rgba(242,242,247,0.5)",
    fontSize: 12,
    fontWeight: "700",
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: {
    backgroundColor: "#4facfe",
  },
  dayInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayCheck: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dayEmpty: {
    color: "rgba(242,242,247,0.3)",
    fontSize: 16,
    fontWeight: "600",
  },

  // Achievements
  achievementList: {
    gap: 0,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  achievementBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 22,
  },
  achievementInfo: {
    flex: 1,
    gap: 2,
  },
  achievementTitle: {
    color: "#F2F2F7",
    fontSize: 15,
    fontWeight: "700",
  },
  achievementDesc: {
    color: "rgba(242,242,247,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  achievementStatus: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "700",
  },
  achievementProgress: {
    color: "rgba(242,242,247,0.5)",
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 56,
  },

  // Motivation
  motivationCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    color: "#65a0e8ff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  motivationSubtext: {
    color: "#85858bff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
