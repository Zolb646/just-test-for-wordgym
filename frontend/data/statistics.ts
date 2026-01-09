/**
 * Statistics and analytics utilities for WordGym
 */

import { Platform } from "react-native";
import { getDatabase } from "./database";
import { Deck, Card } from "./store";

const isWeb = Platform.OS === "web";

/**
 * Deck statistics
 */
export type DeckStats = {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learnedCards: number;
  masteredCards: number;
  averageRetention: number;
};

/**
 * Card rating distribution
 */
export type RatingDistribution = {
  again: number;
  hard: number;
  good: number;
  easy: number;
  unrated: number;
};

/**
 * Overall app statistics
 */
export type AppStats = {
  totalDecks: number;
  totalCards: number;
  totalDueCards: number;
  cardsStudiedToday: number;
  currentStreak: number;
};

/**
 * Get statistics for a specific deck
 */
export async function getDeckStats(deckId: string): Promise<DeckStats> {
  if (isWeb) {
    return {
      totalCards: 0,
      dueCards: 0,
      newCards: 0,
      learnedCards: 0,
      masteredCards: 0,
      averageRetention: 0,
    };
  }

  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  // Get total cards
  const totalResult = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ?",
    [deckId]
  )) as { count: number } | null;
  const totalCards = totalResult?.count || 0;

  // Get due cards (null next_review_date or past due)
  const dueResult = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM cards
     WHERE deck_id = ? AND (next_review_date IS NULL OR next_review_date <= ?)`,
    [deckId, now]
  )) as { count: number } | null;
  const dueCards = dueResult?.count || 0;

  // Get new cards (never reviewed)
  const newResult = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND last_rating IS NULL",
    [deckId]
  )) as { count: number } | null;
  const newCards = newResult?.count || 0;

  // Get learned cards (rated at least once, not mastered)
  const learnedResult = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM cards
     WHERE deck_id = ? AND last_rating IS NOT NULL AND last_rating != 'easy'`,
    [deckId]
  )) as { count: number } | null;
  const learnedCards = learnedResult?.count || 0;

  // Get mastered cards (last rating is easy)
  const masteredResult = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND last_rating = 'easy'",
    [deckId]
  )) as { count: number } | null;
  const masteredCards = masteredResult?.count || 0;

  // Calculate average retention (percentage of good/easy ratings)
  const retentionResult = (await db.getFirstAsync(
    `SELECT
      COUNT(CASE WHEN last_rating IN ('good', 'easy') THEN 1 END) as positive,
      COUNT(CASE WHEN last_rating IS NOT NULL THEN 1 END) as total
     FROM cards WHERE deck_id = ?`,
    [deckId]
  )) as { positive: number; total: number } | null;

  const averageRetention =
    retentionResult && retentionResult.total > 0
      ? Math.round((retentionResult.positive / retentionResult.total) * 100)
      : 0;

  return {
    totalCards,
    dueCards,
    newCards,
    learnedCards,
    masteredCards,
    averageRetention,
  };
}

/**
 * Get rating distribution for a deck
 */
export async function getRatingDistribution(
  deckId: string
): Promise<RatingDistribution> {
  if (isWeb) {
    return { again: 0, hard: 0, good: 0, easy: 0, unrated: 0 };
  }

  const db = getDatabase();

  const result = (await db.getFirstAsync(
    `SELECT
      COUNT(CASE WHEN last_rating = 'again' THEN 1 END) as again_count,
      COUNT(CASE WHEN last_rating = 'hard' THEN 1 END) as hard_count,
      COUNT(CASE WHEN last_rating = 'good' THEN 1 END) as good_count,
      COUNT(CASE WHEN last_rating = 'easy' THEN 1 END) as easy_count,
      COUNT(CASE WHEN last_rating IS NULL THEN 1 END) as unrated_count
     FROM cards WHERE deck_id = ?`,
    [deckId]
  )) as {
    again_count: number;
    hard_count: number;
    good_count: number;
    easy_count: number;
    unrated_count: number;
  } | null;

  return {
    again: result?.again_count || 0,
    hard: result?.hard_count || 0,
    good: result?.good_count || 0,
    easy: result?.easy_count || 0,
    unrated: result?.unrated_count || 0,
  };
}

/**
 * Get overall app statistics
 */
export async function getAppStats(): Promise<AppStats> {
  if (isWeb) {
    return {
      totalDecks: 0,
      totalCards: 0,
      totalDueCards: 0,
      cardsStudiedToday: 0,
      currentStreak: 0,
    };
  }

  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  // Get total decks
  const decksResult = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM decks"
  )) as { count: number } | null;
  const totalDecks = decksResult?.count || 0;

  // Get total cards
  const cardsResult = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM cards"
  )) as { count: number } | null;
  const totalCards = cardsResult?.count || 0;

  // Get total due cards
  const dueResult = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM cards
     WHERE next_review_date IS NULL OR next_review_date <= ?`,
    [now]
  )) as { count: number } | null;
  const totalDueCards = dueResult?.count || 0;

  // Cards studied today (reviewed in the last 24 hours based on next_review_date being set recently)
  // Since we don't have a separate review_date column, we estimate based on next_review_date
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const studiedResult = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM cards
     WHERE last_rating IS NOT NULL AND next_review_date > ?`,
    [todayStart]
  )) as { count: number } | null;
  const cardsStudiedToday = studiedResult?.count || 0;

  return {
    totalDecks,
    totalCards,
    totalDueCards,
    cardsStudiedToday,
    currentStreak: 0, // Would need separate tracking table for accurate streak
  };
}

/**
 * Calculate statistics from in-memory deck data
 */
export function calculateDeckStatsFromMemory(deck: Deck): DeckStats {
  const totalCards = deck.cards.length;
  const newCards = deck.cards.filter((c) => !c.lastRating).length;
  const masteredCards = deck.cards.filter(
    (c) => c.lastRating === "easy"
  ).length;
  const learnedCards = deck.cards.filter(
    (c) => c.lastRating && c.lastRating !== "easy"
  ).length;

  const ratedCards = deck.cards.filter((c) => c.lastRating);
  const positiveRatings = ratedCards.filter(
    (c) => c.lastRating === "good" || c.lastRating === "easy"
  ).length;

  const averageRetention =
    ratedCards.length > 0
      ? Math.round((positiveRatings / ratedCards.length) * 100)
      : 0;

  return {
    totalCards,
    dueCards: totalCards, // In-memory doesn't have next_review_date
    newCards,
    learnedCards,
    masteredCards,
    averageRetention,
  };
}

/**
 * Calculate rating distribution from in-memory card data
 */
export function calculateRatingDistributionFromMemory(
  cards: Card[]
): RatingDistribution {
  return {
    again: cards.filter((c) => c.lastRating === "again").length,
    hard: cards.filter((c) => c.lastRating === "hard").length,
    good: cards.filter((c) => c.lastRating === "good").length,
    easy: cards.filter((c) => c.lastRating === "easy").length,
    unrated: cards.filter((c) => !c.lastRating).length,
  };
}
