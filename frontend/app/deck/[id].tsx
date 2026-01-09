import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "@/components/blur-view";
import { useCallback, useMemo, useState } from "react";
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

import { addCard, toggleFavorite, useStore } from "@/data/store";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";

export default function DeckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const deckId = Array.isArray(params.id) ? params.id[0] : params.id;

  const deck = useStore(
    useCallback(
      (store) => store.decks.find((item) => item.id === deckId) ?? null,
      [deckId]
    )
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [inputFocused, setInputFocused] = useState<
    "word" | "translation" | null
  >(null);

  const toggleEditPopup = () => {
    setIsEdit((prev) => !prev);
  };

  const canAdd = word.trim().length > 0 && translation.trim().length > 0;

  const stats = useMemo(() => {
    const count = deck?.cards?.length ?? 0;
    return { cardCount: count };
  }, [deck?.cards?.length]);

  const handleAdd = () => {
    if (!deckId || !canAdd) return;
    addCard(deckId, word.trim(), translation.trim());
    setWord("");
    setTranslation("");
    setInputFocused(null);
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setWord("");
    setTranslation("");
    setInputFocused(null);
  };

  if (!deck) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Deck</Text>
          <Text style={styles.subtitle}>Олдсонгүй</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Deck олдсонгүй</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Буцах</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bg} />

      <SafeAreaView style={styles.screen} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Top Bar (Apple-ish) */}
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

          <Text style={styles.navTitle} numberOfLines={1}>
            {deck.name}
          </Text>
          <Pressable
            onPress={() => {
              if (deck) toggleFavorite(deck.id);
              setIsEdit(false);
            }}
            hitSlop={12}
          >
            {({ pressed }) => (
              <Feather
                name="star"
                size={20}
                color={
                  pressed ? "#FFEB3B" : deck?.isFavorite ? "#FFD700" : "white"
                }
              />
            )}
          </Pressable>

          <Pressable
            onPress={toggleEditPopup}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && styles.navBtnPressed,
            ]}
            hitSlop={12}
          >
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={24}
              color="white"
            />
          </Pressable>
        </View>
        {isEdit && (
          <View style={styles.editWrap}>
            <View style={styles.editOuterBox}>
              <Pressable
                onPress={() => {
                  setIsEdit(false);
                }}
                style={({ pressed }) => [
                  styles.editInsideBox,
                  {
                    backgroundColor: pressed
                      ? "rgba(255,255,255,0.2)"
                      : "transparent",
                  },
                ]}
              >
                <Feather name="edit-2" size={20} color="white" />
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsEdit(false);
                }}
                style={({ pressed }) => [
                  styles.editInsideBox,
                  {
                    backgroundColor: pressed
                      ? "rgba(255,255,255,0.2)"
                      : "transparent",
                  },
                ]}
              >
                <Feather name="trash-2" size={20} color="white" />
                <Text style={styles.editText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Summary (group card) */}
        <View style={styles.summaryWrap}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Deck-ийн мэдээлэл</Text>
            <Text style={styles.summaryValue}>{stats.cardCount} cards</Text>

            <View style={styles.summaryActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryBtnPressed,
                ]}
                onPress={() => setIsModalOpen(true)}
              >
                <Text style={styles.secondaryBtnText}>Card нэмэх</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtnInline,
                  deck.cards.length === 0 && styles.primaryBtnInlineDisabled,
                  pressed &&
                    deck.cards.length > 0 &&
                    styles.primaryBtnInlinePressed,
                ]}
                onPress={() => {
                  if (deck.cards.length === 0) return;
                  router.push(`/study/${deck.id}`);
                }}
                disabled={deck.cards.length === 0}
              >
                <Text
                  style={[
                    styles.primaryBtnInlineText,
                    deck.cards.length === 0 &&
                      styles.primaryBtnInlineTextDisabled,
                  ]}
                >
                  Study
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* List / Empty */}
        {deck.cards.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🗂️</Text>
            <Text style={styles.emptyTitle}>Одоогоор card алга</Text>
            <Text style={styles.emptyText}>
              Эхний үгээ нэмээд давтлагаа эхлүүлээрэй.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={() => setIsModalOpen(true)}
            >
              <Text style={styles.primaryBtnText}>Card нэмэх</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={deck.cards}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Cards</Text>}
            renderItem={({ item, index }) => {
              const isFirst = index === 0;
              const isLast = index === deck.cards.length - 1;

              return (
                <View style={styles.groupWrap}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cellPress,
                      pressed && styles.cellPressed,
                    ]}
                    onPress={() => {}}
                  >
                    <View
                      style={[
                        styles.cell,
                        isFirst && styles.cellFirst,
                        isLast && styles.cellLast,
                      ]}
                    >
                      <View style={styles.cellTextWrap}>
                        <Text style={styles.cellWord} numberOfLines={1}>
                          {item.word}
                        </Text>
                        <Text style={styles.cellTranslation} numberOfLines={1}>
                          {item.translation}
                        </Text>
                      </View>

                      <Text style={styles.cellChevron}>›</Text>
                    </View>
                  </Pressable>

                  {!isLast && <View style={styles.divider} />}
                </View>
              );
            }}
          />
        )}

        {/* Modal (Apple sheet-ish) */}
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
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Card нэмэх</Text>
                <Text style={styles.modalSubtitle}>
                  Үг болон орчуулгаа оруулаарай
                </Text>

                <View
                  style={[
                    styles.inputWrap,
                    inputFocused === "word" && styles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    value={word}
                    onChangeText={setWord}
                    placeholder="Үг"
                    placeholderTextColor="rgba(242,242,247,0.35)"
                    style={styles.input}
                    onFocus={() => setInputFocused("word")}
                    onBlur={() => setInputFocused(null)}
                    returnKeyType="next"
                  />
                </View>

                <View
                  style={[
                    styles.inputWrap,
                    inputFocused === "translation" && styles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    value={translation}
                    onChangeText={setTranslation}
                    placeholder="Орчуулга"
                    placeholderTextColor="rgba(242,242,247,0.35)"
                    style={styles.input}
                    onFocus={() => setInputFocused("translation")}
                    onBlur={() => setInputFocused(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleAdd}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryBtnModal,
                      pressed && styles.secondaryBtnModalPressed,
                    ]}
                    onPress={closeModal}
                  >
                    <Text style={styles.secondaryBtnModalText}>Болих</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.primaryBtnModal,
                      !canAdd && styles.primaryBtnModalDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!canAdd}
                  >
                    <Text
                      style={[
                        styles.primaryBtnModalText,
                        !canAdd && styles.primaryBtnModalTextDisabled,
                      ]}
                    >
                      Нэмэх
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0B0F",
  },
  screen: { flex: 1, backgroundColor: "transparent" },

  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  largeTitle: {
    color: "#F2F2F7",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(242,242,247,0.55)",
    fontSize: 14,
    fontWeight: "600",
  },

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
  navBtnPlus: {
    color: "#F2F2F7",
    fontSize: 22,
    fontWeight: "500",
    marginTop: -2,
  },

  editWrap: {
    width: 110,
    height: 100,
    position: "absolute",
    top: 100,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },

  editOuterBox: {
    width: 110,
    height: 130,
    display: "flex",
    justifyContent: "center",
    gap: 7,
  },

  editInsideBox: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    height: 40,
    borderRadius: 10,
    marginLeft: 10,
  },

  editText: {
    color: "white",
    fontWeight: "700",
  },

  navTitle: {
    flex: 1,
    color: "#F2F2F7",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },

  summaryWrap: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 10 },
  summaryCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  summaryLabel: {
    color: "rgba(242,242,247,0.45)",
    fontSize: 12.5,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#F2F2F7",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  summaryActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },

  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    color: "rgba(242,242,247,0.40)",
    fontSize: 13,
    fontWeight: "800",
  },

  listContent: { paddingBottom: 40 },
  groupWrap: { marginHorizontal: 12 },
  cellPress: {},
  cellPressed: { opacity: 0.92 },

  cell: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cellFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cellLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 12,
  },

  cellTextWrap: { flex: 1, gap: 3 },
  cellWord: { color: "#F2F2F7", fontSize: 16, fontWeight: "800" },
  cellTranslation: {
    color: "rgba(242,242,247,0.45)",
    fontSize: 13,
    fontWeight: "700",
  },
  cellChevron: {
    color: "rgba(242,242,247,0.35)",
    fontSize: 24,
    fontWeight: "600",
    marginTop: -2,
  },

  divider: {
    height: 1,
    marginLeft: 58,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 10,
  },
  emptyIcon: { fontSize: 28, marginBottom: 2 },
  emptyTitle: { color: "#F2F2F7", fontSize: 18, fontWeight: "900" },
  emptyText: {
    color: "rgba(242,242,247,0.50)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },

  primaryBtn: {
    marginTop: 6,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  primaryBtnText: { color: "#F2F2F7", fontSize: 15, fontWeight: "900" },

  secondaryBtn: {
    height: 40,
    paddingHorizontal: 14,
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
    color: "rgba(242,242,247,0.75)",
    fontSize: 13.5,
    fontWeight: "900",
  },

  primaryBtnInline: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  primaryBtnInlineDisabled: { opacity: 0.45 },
  primaryBtnInlinePressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  primaryBtnInlineText: { color: "#F2F2F7", fontSize: 13.5, fontWeight: "900" },
  primaryBtnInlineTextDisabled: { color: "rgba(242,242,247,0.45)" },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "center", padding: 16 },
  modalTapBlock: { width: "100%", maxWidth: 520, alignSelf: "center" },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(20,20,26,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modalTitle: { color: "#F2F2F7", fontSize: 18, fontWeight: "900" },
  modalSubtitle: {
    marginTop: 6,
    color: "rgba(242,242,247,0.45)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },

  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    overflow: "hidden",
    marginBottom: 10,
  },
  inputWrapFocused: { borderColor: "rgba(120,140,255,0.85)" },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#F2F2F7",
    fontSize: 15,
    fontWeight: "700",
  },

  modalActions: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  secondaryBtnModal: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnModalPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnModalText: {
    color: "rgba(242,242,247,0.75)",
    fontWeight: "900",
    fontSize: 14,
  },

  primaryBtnModal: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  primaryBtnModalDisabled: { opacity: 0.45 },
  primaryBtnModalText: { color: "#F2F2F7", fontWeight: "900", fontSize: 14 },
  primaryBtnModalTextDisabled: { color: "rgba(242,242,247,0.45)" },
});
