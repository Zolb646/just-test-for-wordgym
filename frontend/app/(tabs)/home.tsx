import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BlurView } from "@/components/blur-view";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addDeck, useStore } from "@/data/store";
import { getStreakData } from "@/data/queries";
import { GlassView } from "@/components/glass-view";

export default function HomeScreen() {
  const router = useRouter();
  const decks = useStore((store) => store.decks);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [streak, setStreak] = useState(0);
  const canCreate = deckName.trim().length > 0;

  // Load streak data on mount
  useEffect(() => {
    async function loadStreak() {
      try {
        const streakData = await getStreakData();
        if (streakData) {
          setStreak(streakData.current_streak);
        }
      } catch (error) {
        console.error("Failed to load streak:", error);
      }
    }
    loadStreak();
  }, []);

  const stats = useMemo(() => {
    const cardCount = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    return { deckCount: decks.length, cardCount };
  }, [decks]);

  const handleCreate = async () => {
    const name = deckName.trim();
    if (!name) return;
    try {
      const deck = await addDeck(name);
      setDeckName("");
      setIsModalOpen(false);
      router.push(`/deck/${deck.id}`);
    } catch (error) {
      console.error("Failed to create deck:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDeckName("");
  };
  return (
    <View style={styles.container}>
      {/* Apple-like dark background */}
      <LinearGradient
        colors={["#0B0B0F", "#0F0F15", "#0B0B0F"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.screen} edges={["top"]}>
        {/* Large Title Header (Files/Contacts vibe) */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <View>
                <Text style={styles.largeTitle}>WordGym</Text>
                <Text style={styles.tagline}>
                  Үг цээжлэх хамгийн хялбар арга
                </Text>
              </View>
            </View>
            <View style={styles.logo}>
              <Pressable onPress={() => router.push(`/streak/g`)}>
                <LinearGradient
                  colors={["#667eea", "#4facfe"]}
                  style={styles.streakGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.logoStreak}>{streak}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Stats Pills */}
          {decks.length > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statNumber}>{stats.deckCount}</Text>
                <Text style={styles.statLabel}>Deck</Text>
              </View>
              <View style={[styles.statPill, styles.statPillAccent]}>
                <Text style={[styles.statNumber, styles.statNumberAccent]}>
                  {stats.cardCount}
                </Text>
                <Text style={[styles.statLabel, styles.statLabelAccent]}>
                  Card
                </Text>
              </View>
            </View>
          )}
        </View>
        {/* Content */}
        {decks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <GlassView
              style={styles.emptyCard}
              variant="surface"
              intensity={18}
            >
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📚</Text>
              </View>

              <Text style={styles.emptyTitle}>Анхны deck-ээ үүсгэ</Text>
              <Text style={styles.emptyDesc}>
                Deck үүсгээд card нэмээд, давтлага хийж эхэлнэ.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryBtnPressed,
                ]}
                onPress={() => setIsModalOpen(true)}
              >
                <Text style={styles.primaryBtnText}>Deck үүсгэх</Text>
              </Pressable>
            </GlassView>
          </View>
        ) : (
          <FlatList
            data={decks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>My Decks</Text>
            }
            renderItem={({ item, index }) => {
              const isFirst = index === 0;
              const isLast = index === decks.length - 1;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.cellPress,
                    pressed && styles.cellPressed,
                  ]}
                  onPress={() => router.push(`/deck/${item.id}`)}
                >
                  {/* Grouped container look:
                      - first/last get rounded corners
                      - middle stays square */}
                  <GlassView
                    variant="surface"
                    intensity={16}
                    style={[
                      styles.cellSurface,
                      isFirst && styles.cellFirst,
                      isLast && styles.cellLast,
                    ]}
                  >
                    <View style={styles.cellRow}>
                      <View style={styles.cellIcon}>
                        <Text style={styles.cellIconText}>📁</Text>
                      </View>

                      <View style={styles.cellBody}>
                        <View style={styles.cellTitleRow}>
                          <Text style={styles.cellTitle} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.isFavorite && (
                            <Text style={styles.favoriteIcon}>⭐</Text>
                          )}
                        </View>
                        <Text style={styles.cellMeta}>
                          {item.cards.length}{" "}
                          {item.cards.length === 1 ? "card" : "cards"}
                        </Text>
                      </View>

                      <Text style={styles.cellChevron}>›</Text>
                    </View>

                    {!isLast && <View style={styles.cellDivider} />}
                  </GlassView>
                </Pressable>
              );
            }}
          />
        )}

        {/* Floating Action Button */}
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setIsModalOpen(true)}
        >
          <LinearGradient
            colors={["#667eea", "#4facfe"]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </Pressable>

        {/* Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={isModalOpen}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.modalOverlay} onPress={closeModal}>
            <BlurView
              intensity={22}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />

            <Pressable
              style={styles.modalTapBlock}
              onPress={(e) => e.stopPropagation()}
            >
              <GlassView
                style={styles.modalCard}
                variant="surface"
                intensity={28}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New deck</Text>
                  <Text style={styles.modalSubtitle}>
                    Deck-ийн нэрийг оруулна уу
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputWrap,
                    inputFocused && styles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    value={deckName}
                    onChangeText={setDeckName}
                    placeholder="Жишээ: IELTS Vocabulary"
                    placeholderTextColor="rgba(242,242,247,0.35)"
                    style={styles.input}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCreate}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                </View>
                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.secondaryBtnPressed,
                    ]}
                    onPress={closeModal}
                  >
                    <Text style={styles.secondaryBtnText}>Болих</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtnSmall,
                      !canCreate && styles.primaryBtnSmallDisabled,
                      pressed && canCreate && styles.primaryBtnSmallPressed,
                    ]}
                    onPress={handleCreate}
                    disabled={!canCreate}
                  >
                    <Text
                      style={[
                        styles.primaryBtnSmallText,
                        !canCreate && styles.primaryBtnSmallTextDisabled,
                      ]}
                    >
                      Үүсгэх
                    </Text>
                  </Pressable>
                </View>
              </GlassView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statNumber: {
    color: "#F2F2F7",
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(242,242,247,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  statPillAccent: {
    backgroundColor: "rgba(102,126,234,0.15)",
    borderColor: "rgba(102,126,234,0.3)",
  },
  statNumberAccent: {
    color: "#667eea",
  },
  statLabelAccent: {
    color: "rgba(102,126,234,0.9)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  largeTitle: {
    color: "#F2F2F7",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: 4,
    color: "rgba(242,242,247,0.5)",
    fontSize: 13,
    fontWeight: "500",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(242,242,247,0.55)",
    fontSize: 14,
    fontWeight: "600",
  },
  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 90,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "300",
    marginTop: -3,
  },
  logoGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoIcon: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  logo: {
    borderRadius: 12,
    overflow: "hidden",
  },
  streakGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 18,
  },
  logoStreak: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  headerAddText: {
    color: "#667eea",
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },

  sectionTitle: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    color: "#F2F2F7",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  listContent: {
    paddingBottom: 120,
    paddingTop: 8,
  },

  cellPress: {
    marginHorizontal: 16,
  },
  cellPressed: { opacity: 0.92 },

  cellSurface: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 0,
  },
  cellFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  cellLast: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 12,
  },

  cellRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  cellDivider: {
    height: 1,
    marginLeft: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  cellIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cellIconText: { fontSize: 16 },

  cellBody: { flex: 1, gap: 2 },
  cellTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cellTitle: {
    color: "#F2F2F7",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  favoriteIcon: {
    fontSize: 12,
  },
  cellMeta: {
    color: "rgba(242,242,247,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  cellChevron: {
    color: "rgba(242,242,247,0.35)",
    fontSize: 24,
    fontWeight: "600",
    marginTop: -2,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 18,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyIconText: { fontSize: 22 },
  emptyTitle: {
    marginTop: 14,
    color: "#F2F2F7",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  emptyDesc: {
    marginTop: 6,
    color: "rgba(242,242,247,0.50)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },

  primaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  primaryBtnText: {
    color: "#F2F2F7",
    fontSize: 15,
    fontWeight: "800",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  modalTapBlock: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modalHeader: {
    gap: 6,
  },
  modalTitle: {
    color: "#F2F2F7",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    color: "rgba(242,242,247,0.45)",
    fontSize: 13,
    fontWeight: "700",
  },

  inputWrap: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    overflow: "hidden",
  },
  inputWrapFocused: {
    borderColor: "rgba(120,140,255,0.85)",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#F2F2F7",
    fontSize: 15,
    fontWeight: "700",
  },

  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  secondaryBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnText: {
    color: "rgba(242,242,247,0.70)",
    fontWeight: "900",
    fontSize: 14,
  },

  primaryBtnSmall: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  primaryBtnSmallDisabled: { opacity: 0.5 },
  primaryBtnSmallPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  primaryBtnSmallText: {
    color: "#F2F2F7",
    fontWeight: "900",
    fontSize: 14,
  },
  primaryBtnSmallTextDisabled: {
    color: "rgba(242,242,247,0.35)",
  },
});
