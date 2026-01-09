import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DeckCategory = {
  id: string;
  title: string;
  icon: string;
  deckCount: number;
  gradient: [string, string];
};

type PrebuiltDeck = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  difficulty: "Анхан" | "Дунд" | "Ахисан";
  icon: string;
  gradient: [string, string];
  isPopular?: boolean;
  // 🔎 Search/Filter-д хэрэгтэй:
  language?:
    | "Англи хэл"
    | "Япон хэл"
    | "Солонгос хэл"
    | "Хятад хэл"
    | "Миний дэк";
};

const CATEGORIES: DeckCategory[] = [
  {
    id: "1",
    title: "Миний дек",
    icon: "🇲🇳",
    deckCount: 3,
    gradient: ["#667eea", "#764ba2"],
  },
  {
    id: "2",
    title: "Англи хэл",
    icon: "🇬🇧",
    deckCount: 24,
    gradient: ["#667eea", "#764ba2"],
  },
  {
    id: "3",
    title: "Япон хэл",
    icon: "🇯🇵",
    deckCount: 18,
    gradient: ["#f093fb", "#f5576c"],
  },
  {
    id: "4",
    title: "Солонгос хэл",
    icon: "🇰🇷",
    deckCount: 15,
    gradient: ["#4facfe", "#00f2fe"],
  },
  {
    id: "5",
    title: "Хятад хэл",
    icon: "🇨🇳",
    deckCount: 12,
    gradient: ["#fa709a", "#fee140"],
  },
];

const FEATURED_DECKS: PrebuiltDeck[] = [
  {
    id: "1",
    name: "IELTS Essential Words",
    description: "IELTS шалгалтад хамгийн их гардаг үгс",
    cardCount: 500,
    difficulty: "Дунд",
    icon: "📚",
    gradient: ["#667eea", "#764ba2"],
    isPopular: true,
    language: "Англи хэл",
  },
  {
    id: "2",
    name: "Daily English",
    description: "Өдөр тутмын хэрэгцээт үгс, хэллэгүүд",
    cardCount: 300,
    difficulty: "Анхан",
    icon: "💬",
    gradient: ["#43e97b", "#38f9d7"],
    language: "Англи хэл",
  },
  {
    id: "3",
    name: "Business English",
    description: "Бизнесийн англи хэлний үг хэллэг",
    cardCount: 250,
    difficulty: "Ахисан",
    icon: "💼",
    gradient: ["#4facfe", "#00f2fe"],
    language: "Англи хэл",
  },
  {
    id: "4",
    name: "TOPIK Vocabulary",
    description: "Солонгос хэлний түвшин тогтоох шалгалт",
    cardCount: 400,
    difficulty: "Дунд",
    icon: "🎯",
    gradient: ["#f093fb", "#f5576c"],
    isPopular: true,
    language: "Солонгос хэл",
  },
  {
    id: "5",
    name: "TOPIK ",
    description: "Солонгос хэл",
    cardCount: 200,
    difficulty: "Дунд",
    icon: "🎯",
    gradient: ["#f093fb", "#f5576c"],
    isPopular: true,
    language: "Миний дэк",
  },
];

function CategoryCard({
  category,
  selected,
  onPress,
}: {
  category: DeckCategory;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        pressed && styles.categoryCardPressed,
        selected && styles.categoryCardSelected,
      ]}
    >
      <LinearGradient
        colors={[`${category.gradient[0]}20`, `${category.gradient[1]}10`]}
        style={styles.categoryCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryCount}>{category.deckCount} deck</Text>
      </LinearGradient>
    </Pressable>
  );
}

function DeckCard({ deck }: { deck: PrebuiltDeck }) {
  const difficultyColor =
    deck.difficulty === "Анхан"
      ? "#43e97b"
      : deck.difficulty === "Дунд"
        ? "#4facfe"
        : "#f5576c";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.deckCard,
        pressed && styles.deckCardPressed,
      ]}
    >
      <LinearGradient
        colors={deck.gradient}
        style={styles.deckAccentLine}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.deckCardContent}>
        <View style={styles.deckCardHeader}>
          <LinearGradient
            colors={[`${deck.gradient[0]}30`, `${deck.gradient[1]}20`]}
            style={styles.deckIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.deckIcon}>{deck.icon}</Text>
          </LinearGradient>

          {deck.isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>🔥 Түгээмэл</Text>
            </View>
          )}
        </View>

        <View style={styles.deckInfo}>
          <Text style={styles.deckName}>{deck.name}</Text>
          <Text style={styles.deckDescription} numberOfLines={2}>
            {deck.description}
          </Text>
        </View>

        <View style={styles.deckMeta}>
          <View style={styles.deckMetaItem}>
            <Text style={styles.deckMetaValue}>{deck.cardCount}</Text>
            <Text style={styles.deckMetaLabel}>card</Text>
          </View>

          <View
            style={[styles.difficultyBadge, { borderColor: difficultyColor }]}
          >
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: difficultyColor },
              ]}
            />
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {deck.difficulty}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        ></Pressable>
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const activeCategoryTitle = useMemo(() => {
    if (!activeCategoryId) return null;
    return CATEGORIES.find((c) => c.id === activeCategoryId)?.title ?? null;
  }, [activeCategoryId]);

  const filteredDecks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return FEATURED_DECKS.filter((deck) => {
      const matchesQuery =
        q.length === 0 ||
        deck.name.toLowerCase().includes(q) ||
        deck.description.toLowerCase().includes(q);

      const matchesCategory =
        !activeCategoryTitle || deck.language === activeCategoryTitle;

      return matchesQuery && matchesCategory;
    });
  }, [searchQuery, activeCategoryTitle]);

  const isFiltering = searchQuery.trim().length > 0 || !!activeCategoryTitle;

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategoryId(null);
  };
  const getSectionTitle = () => {
    if (isFiltering) return "Хайлт / Шүүлт";
    if (activeCategoryId === "1") return "Миний дек";
    return "Онцлох Deck-үүд";
  };
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0f", "#12121a", "#0a0a0f"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.orbContainer} pointerEvents="none">
        <LinearGradient
          colors={["rgba(102, 126, 234, 0.12)", "transparent"]}
          style={[styles.orb, styles.orbTopRight]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={["rgba(79, 172, 254, 0.08)", "transparent"]}
          style={[styles.orb, styles.orbBottomLeft]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Хайлтын хэсэг</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Deck хайх..."
                placeholderTextColor="#505060"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {(searchQuery.trim().length > 0 || activeCategoryId) && (
                <Pressable onPress={clearFilters} hitSlop={10}>
                  <Text style={styles.clearText}>Цэвэрлэх</Text>
                </Pressable>
              )}
            </View>

            {/* Active filter chips */}
            {(searchQuery.trim().length > 0 || activeCategoryTitle) && (
              <View style={styles.filterRow}>
                {activeCategoryTitle && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      {activeCategoryTitle}
                    </Text>
                    <Pressable
                      onPress={() => setActiveCategoryId(null)}
                      hitSlop={10}
                    >
                      <Text style={styles.filterChipX}>×</Text>
                    </Pressable>
                  </View>
                )}
                {searchQuery.trim().length > 0 && (
                  <View style={styles.filterChip}>
                    <Text
                      style={styles.filterChipText}
                      numberOfLines={1}
                    >{`"${searchQuery.trim()}"`}</Text>
                    <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
                      <Text style={styles.filterChipX}>×</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ангилал</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {CATEGORIES.map((category) => {
                const selected = activeCategoryId === category.id;
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    selected={selected}
                    onPress={() =>
                      setActiveCategoryId((prev) =>
                        prev === category.id ? null : category.id
                      )
                    }
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Featured / Search results */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

              {isFiltering && (
                <Pressable onPress={clearFilters}>
                  <Text style={styles.seeAllText}>Шүүлт арилгах</Text>
                </Pressable>
              )}
            </View>
            {filteredDecks.length === 0 ? (
              <View style={styles.emptyResult}>
                <Text style={styles.emptyIcon}>🧐</Text>
                <Text style={styles.emptyTitle}>Илэрц олдсонгүй</Text>
                <Text style={styles.emptyText}>
                  Өөр түлхүүр үг ашиглаад үзээрэй, эсвэл ангиллаа арилгаарай.
                </Text>
                <Pressable style={styles.emptyBtn} onPress={clearFilters}>
                  <Text style={styles.emptyBtnText}>Цэвэрлэх</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.decksGrid}>
                {filteredDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </View>
            )}
          </View>

          {!isFiltering && (
            <View style={styles.comingSoon}>
              <LinearGradient
                colors={[
                  "rgba(102, 126, 234, 0.1)",
                  "rgba(79, 172, 254, 0.05)",
                ]}
                style={styles.comingSoonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.comingSoonIcon}>🚀</Text>
                <Text style={styles.comingSoonTitle}>Тун удахгүй</Text>
                <Text style={styles.comingSoonText}>
                  Илүү олон хэл, сэдвүүдээр deck нэмэгдэх болно
                </Text>
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  orbContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  orb: { position: "absolute", width: 400, height: 400, borderRadius: 200 },
  orbTopRight: { top: -150, right: -150 },
  orbBottomLeft: { bottom: -100, left: -150 },
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  title: {
    color: "#68acd6ff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: "#f5f5f7",
    fontSize: 16,
    outlineWidth: 0,
  },
  clearText: {
    color: "rgba(245,245,247,0.55)",
    fontSize: 13,
    fontWeight: "600",
    paddingLeft: 10,
    paddingVertical: 10,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: "100%",
  },
  filterChipText: {
    color: "rgba(245,245,247,0.70)",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipX: {
    color: "rgba(245,245,247,0.55)",
    fontSize: 16,
    fontWeight: "900",
    marginTop: -2,
  },

  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#8a8a98",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  seeAllText: { color: "#667eea", fontSize: 14, fontWeight: "600" },

  categoriesRow: { paddingHorizontal: 16, gap: 10 },
  categoryCard: { borderRadius: 16, overflow: "hidden" },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  categoryCardSelected: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  categoryCardGradient: {
    width: 120,
    height: 140,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    flex: 1,
    gap: 5,
  },
  categoryIcon: { fontSize: 32, marginBottom: 10 },
  categoryTitle: {
    color: "#f5f5f7",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  categoryCount: { color: "#6b6b78", fontSize: 12, fontWeight: "500" },

  decksGrid: { paddingHorizontal: 16, gap: 14 },

  deckCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  deckCardPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
    transform: [{ scale: 0.98 }],
  },
  deckAccentLine: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    borderRadius: 2,
  },
  deckCardContent: { padding: 18, paddingLeft: 20 },
  deckCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  deckIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deckIcon: { fontSize: 26 },
  popularBadge: {
    backgroundColor: "rgba(250, 112, 154, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 112, 154, 0.3)",
  },
  popularBadgeText: { color: "#fa709a", fontSize: 11, fontWeight: "600" },
  deckInfo: { marginBottom: 14 },
  deckName: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  deckDescription: { color: "#7a7a88", fontSize: 14, lineHeight: 20 },
  deckMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  deckMetaItem: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  deckMetaValue: { color: "#f5f5f7", fontSize: 18, fontWeight: "700" },
  deckMetaLabel: { color: "#6b6b78", fontSize: 13, fontWeight: "500" },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyDot: { width: 6, height: 6, borderRadius: 3 },
  difficultyText: { fontSize: 12, fontWeight: "600" },

  addButton: { borderRadius: 12, overflow: "hidden" },
  addButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  addButtonGradient: { paddingVertical: 12, alignItems: "center" },
  addButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

  emptyResult: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
  },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyTitle: {
    color: "#f5f5f7",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyText: {
    color: "#7a7a88",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyBtnText: { color: "rgba(245,245,247,0.75)", fontWeight: "700" },

  comingSoon: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 50,
  },
  comingSoonGradient: {
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.2)",
    borderRadius: 20,
  },
  comingSoonIcon: { fontSize: 32, marginBottom: 6 },
  comingSoonTitle: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  comingSoonText: { color: "#7a7a88", fontSize: 14, textAlign: "center" },
});
