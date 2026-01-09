import { Rating, rateCard, useStore } from "@/data/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "./_components/Card";
import { RatingButtons } from "./_components/ratingButtons";
import { TopBar } from "./_components/topBar";
import { Congrats } from "./_components/congrats";

export default function StudyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const deckId = Array.isArray(params.id) ? params.id[0] : params.id;

  const deck = useStore(
    useCallback(
      (store) => store.decks.find((item) => item.id === deckId) ?? null,
      [deckId]
    )
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const total = deck?.cards?.length ?? 0;
  const card = useMemo(
    () => deck?.cards[currentIndex] ?? null,
    [deck, currentIndex]
  );

  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [deckId]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!deck || !card) return;

      await rateCard(deck.id, card.id, rating);
      setShowAnswer(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [deck, card]
  );

  if (!deck) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Дасгал хийх card алга байна.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Буцах</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= deck.cards.length) {
    return <Congrats setCurrentIndex={setCurrentIndex} />;
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Дасгал хийх card алга байна.</Text>
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
        <TopBar currentIndex={currentIndex} total={total} />
        <Card
          showAnswer={showAnswer}
          setShowAnswer={setShowAnswer}
          card={card}
        />
        {showAnswer && <RatingButtons onRate={handleRate} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0B0B0F" },

  screen: { flex: 1, paddingHorizontal: 14, backgroundColor: "transparent" },

  hintWrap: { alignItems: "center", gap: 4 },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: { color: "#F2F2F7", fontSize: 18, fontWeight: "900" },
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
});
