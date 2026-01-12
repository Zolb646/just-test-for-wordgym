/**
 * Database query functions for WordGym
 * All CRUD operations for decks and cards
 */

import { Platform } from "react-native";
import { getDatabase } from "./database";
import { Deck, Card, Rating } from "./store";
import { CardRow, DeckRow, StreakDataRow, calculateNextReviewDate, formatReviewLabel } from "./schema";

const isWeb = Platform.OS === "web";

/**
 * Convert database row to Card type
 */
function rowToCard(row: CardRow): Card {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    lastRating: row.last_rating || undefined,
    nextReviewLabel: row.last_rating ? formatReviewLabel(row.last_rating) : undefined,
  };
}

/**
 * Convert database row to Deck type (without cards)
 */
function rowToDeck(row: DeckRow): Omit<Deck, "cards"> {
  return {
    id: row.id,
    name: row.name,
    isFavorite: row.is_favorite === 1,
  };
}

// ==================== DECK QUERIES ====================

/**
 * Get all decks with their cards
 */
export async function getAllDecks(): Promise<Deck[]> {
  if (isWeb) {
    console.log("getAllDecks: Web platform - returning empty array");
    return [];
  }

  const db = getDatabase();

  // Get all decks
  const deckRows = (await db.getAllAsync(
    "SELECT * FROM decks ORDER BY created_at DESC"
  )) as DeckRow[];

  // Get cards for each deck
  const decks: Deck[] = [];
  for (const deckRow of deckRows) {
    const cardRows = (await db.getAllAsync(
      "SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC",
      [deckRow.id]
    )) as CardRow[];

    decks.push({
      ...rowToDeck(deckRow),
      cards: cardRows.map(rowToCard),
    });
  }

  return decks;
}

/**
 * Get a single deck by ID with its cards
 */
export async function getDeckById(deckId: string): Promise<Deck | null> {
  if (isWeb) return null;

  const db = getDatabase();

  const deckRow = (await db.getFirstAsync(
    "SELECT * FROM decks WHERE id = ?",
    [deckId]
  )) as DeckRow | null;

  if (!deckRow) return null;

  const cardRows = (await db.getAllAsync(
    "SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC",
    [deckId]
  )) as CardRow[];

  return {
    ...rowToDeck(deckRow),
    cards: cardRows.map(rowToCard),
  };
}

/**
 * Add a new deck
 */
export async function addDeck(name: string): Promise<Deck> {
  const id = `${Date.now()}`;
  const deck: Deck = {
    id,
    name,
    cards: [],
    isFavorite: false,
  };

  if (isWeb) {
    console.log("addDeck: Web platform - deck not persisted");
    return deck;
  }

  const db = getDatabase();
  await db.runAsync(
    "INSERT INTO decks (id, name, is_favorite) VALUES (?, ?, 0)",
    [id, name]
  );

  return deck;
}

/**
 * Toggle deck favorite status
 */
export async function toggleFavorite(deckId: string): Promise<boolean | null> {
  if (isWeb) {
    console.log("toggleFavorite: Web platform - not persisted");
    return null;
  }

  const db = getDatabase();

  // Get current favorite status
  const row = await db.getFirstAsync(
    "SELECT is_favorite FROM decks WHERE id = ?",
    [deckId]
  ) as { is_favorite: number } | null;

  if (!row) return null;

  const newValue = row.is_favorite === 1 ? 0 : 1;

  await db.runAsync(
    "UPDATE decks SET is_favorite = ? WHERE id = ?",
    [newValue, deckId]
  );

  return newValue === 1;
}

/**
 * Update deck name
 */
export async function updateDeck(deckId: string, name: string): Promise<boolean> {
  if (isWeb) return false;

  const db = getDatabase();

  const result = await db.runAsync(
    "UPDATE decks SET name = ? WHERE id = ?",
    [name, deckId]
  );

  return result.changes > 0;
}

/**
 * Delete a deck and all its cards
 */
export async function deleteDeck(deckId: string): Promise<boolean> {
  if (isWeb) return false;

  const db = getDatabase();

  const result = await db.runAsync(
    "DELETE FROM decks WHERE id = ?",
    [deckId]
  );

  return result.changes > 0;
}

/**
 * Import decks from cloud (replaces local data)
 */
export async function importDecks(decks: Deck[]): Promise<void> {
  if (isWeb) {
    console.log("importDecks: Web platform - not persisted");
    return;
  }

  const db = getDatabase();

  // Clear existing data
  await db.runAsync("DELETE FROM cards");
  await db.runAsync("DELETE FROM decks");

  // Insert all decks and cards
  for (const deck of decks) {
    await db.runAsync(
      "INSERT INTO decks (id, name, is_favorite, created_at) VALUES (?, ?, ?, ?)",
      [deck.id, deck.name, deck.isFavorite ? 1 : 0, Date.now()]
    );

    for (const card of deck.cards) {
      await db.runAsync(
        "INSERT INTO cards (id, deck_id, word, translation, last_rating, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [card.id, deck.id, card.word, card.translation, card.lastRating || null, Date.now()]
      );
    }
  }
}

// ==================== CARD QUERIES ====================

/**
 * Get all cards for a specific deck
 */
export async function getCardsByDeckId(deckId: string): Promise<Card[]> {
  if (isWeb) return [];

  const db = getDatabase();

  const cardRows = (await db.getAllAsync(
    "SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC",
    [deckId]
  )) as CardRow[];

  return cardRows.map(rowToCard);
}

/**
 * Get a single card by ID
 */
export async function getCardById(cardId: string): Promise<Card | null> {
  if (isWeb) return null;

  const db = getDatabase();

  const cardRow = (await db.getFirstAsync(
    "SELECT * FROM cards WHERE id = ?",
    [cardId]
  )) as CardRow | null;

  return cardRow ? rowToCard(cardRow) : null;
}

/**
 * Add a new card to a deck
 */
export async function addCard(
  deckId: string,
  word: string,
  translation: string
): Promise<Card> {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const card: Card = {
    id,
    word,
    translation,
  };

  if (isWeb) {
    console.log("addCard: Web platform - card not persisted");
    return card;
  }

  const db = getDatabase();
  await db.runAsync(
    "INSERT INTO cards (id, deck_id, word, translation) VALUES (?, ?, ?, ?)",
    [id, deckId, word, translation]
  );

  return card;
}

/**
 * Update a card's content
 */
export async function updateCard(
  cardId: string,
  word: string,
  translation: string
): Promise<boolean> {
  if (isWeb) return false;

  const db = getDatabase();

  const result = await db.runAsync(
    "UPDATE cards SET word = ?, translation = ? WHERE id = ?",
    [word, translation, cardId]
  );

  return result.changes > 0;
}

/**
 * Rate a card and update its review schedule
 */
export async function rateCard(
  cardId: string,
  rating: Rating
): Promise<Card | null> {
  if (isWeb) {
    console.log("rateCard: Web platform - rating not persisted");
    return {
      id: cardId,
      word: "",
      translation: "",
      lastRating: rating,
      nextReviewLabel: formatReviewLabel(rating),
    };
  }

  const db = getDatabase();
  const nextReviewDate = calculateNextReviewDate(rating);

  const result = await db.runAsync(
    "UPDATE cards SET last_rating = ?, next_review_date = ? WHERE id = ?",
    [rating, nextReviewDate, cardId]
  );

  if (result.changes === 0) return null;

  return await getCardById(cardId);
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string): Promise<boolean> {
  if (isWeb) return false;

  const db = getDatabase();

  const result = await db.runAsync(
    "DELETE FROM cards WHERE id = ?",
    [cardId]
  );

  return result.changes > 0;
}

/**
 * Get cards due for review in a specific deck
 */
export async function getDueCards(deckId: string): Promise<Card[]> {
  if (isWeb) return [];

  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  const cardRows = (await db.getAllAsync(
    `SELECT * FROM cards
     WHERE deck_id = ?
     AND (next_review_date IS NULL OR next_review_date <= ?)
     ORDER BY created_at DESC`,
    [deckId, now]
  )) as CardRow[];

  return cardRows.map(rowToCard);
}

/**
 * Get total card count for a deck
 */
export async function getCardCount(deckId: string): Promise<number> {
  if (isWeb) return 0;

  const db = getDatabase();

  const result = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ?",
    [deckId]
  )) as { count: number } | null;

  return result?.count || 0;
}

// ==================== STREAK QUERIES ====================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

/**
 * Get streak data
 */
export async function getStreakData(): Promise<StreakDataRow | null> {
  if (isWeb) return null;

  const db = getDatabase();

  const row = (await db.getFirstAsync(
    "SELECT * FROM streak_data WHERE id = 1"
  )) as StreakDataRow | null;

  return row;
}

/**
 * Record a study session and update streak
 */
export async function recordStudySession(cardsStudied: number): Promise<StreakDataRow | null> {
  if (isWeb) return null;

  const db = getDatabase();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const now = Math.floor(Date.now() / 1000);

  // Check if we already have a session for today
  const existingSession = await db.getFirstAsync(
    "SELECT * FROM study_sessions WHERE date = ?",
    [today]
  );

  if (existingSession) {
    // Update existing session
    await db.runAsync(
      "UPDATE study_sessions SET cards_studied = cards_studied + ? WHERE date = ?",
      [cardsStudied, today]
    );
  } else {
    // Create new session
    const sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await db.runAsync(
      "INSERT INTO study_sessions (id, date, cards_studied) VALUES (?, ?, ?)",
      [sessionId, today, cardsStudied]
    );
  }

  // Get current streak data
  const streakData = (await db.getFirstAsync(
    "SELECT * FROM streak_data WHERE id = 1"
  )) as StreakDataRow;

  let newCurrentStreak = streakData.current_streak;
  let newBestStreak = streakData.best_streak;
  const lastStudyDate = streakData.last_study_date;

  // Calculate new streak
  if (lastStudyDate === today) {
    // Already studied today, no streak change
  } else if (lastStudyDate === yesterday) {
    // Studied yesterday, increment streak
    newCurrentStreak += 1;
  } else if (!lastStudyDate) {
    // First time studying
    newCurrentStreak = 1;
  } else {
    // Streak broken, start fresh
    newCurrentStreak = 1;
  }

  // Update best streak if needed
  if (newCurrentStreak > newBestStreak) {
    newBestStreak = newCurrentStreak;
  }

  // Update streak data
  await db.runAsync(
    "UPDATE streak_data SET current_streak = ?, best_streak = ?, last_study_date = ?, updated_at = ? WHERE id = 1",
    [newCurrentStreak, newBestStreak, today, now]
  );

  return {
    id: 1,
    current_streak: newCurrentStreak,
    best_streak: newBestStreak,
    last_study_date: today,
    updated_at: now,
  };
}

/**
 * Get weekly activity (last 7 days)
 * Returns array of booleans for each day [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 */
export async function getWeeklyActivity(): Promise<boolean[]> {
  if (isWeb) return [false, false, false, false, false, false, false];

  const db = getDatabase();

  // Get dates for the last 7 days
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  // Query for sessions in these dates
  const sessions = (await db.getAllAsync(
    `SELECT date FROM study_sessions WHERE date IN (${dates.map(() => "?").join(",")})`,
    dates
  )) as { date: string }[];

  const studiedDates = new Set(sessions.map((s) => s.date));

  return dates.map((date) => studiedDates.has(date));
}

/**
 * Get total cards studied today
 */
export async function getCardsStudiedToday(): Promise<number> {
  if (isWeb) return 0;

  const db = getDatabase();
  const today = getTodayDate();

  const result = (await db.getFirstAsync(
    "SELECT cards_studied FROM study_sessions WHERE date = ?",
    [today]
  )) as { cards_studied: number } | null;

  return result?.cards_studied || 0;
}
