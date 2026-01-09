/**
 * Study session utilities for WordGym
 * Handles card cycling, session state, and study flow
 */

import { Card, Rating } from "./store";

/**
 * Study session state
 */
export type StudySession = {
  deckId: string;
  cards: Card[];
  currentIndex: number;
  isFlipped: boolean;
  completedCards: string[];
  sessionStats: SessionStats;
};

/**
 * Session statistics
 */
export type SessionStats = {
  totalCards: number;
  cardsReviewed: number;
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  startTime: number;
  endTime?: number;
};

/**
 * Create a new study session
 */
export function createStudySession(deckId: string, cards: Card[]): StudySession {
  return {
    deckId,
    cards: [...cards],
    currentIndex: 0,
    isFlipped: false,
    completedCards: [],
    sessionStats: {
      totalCards: cards.length,
      cardsReviewed: 0,
      ratings: {
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
      },
      startTime: Date.now(),
    },
  };
}

/**
 * Get current card in session
 */
export function getCurrentCard(session: StudySession): Card | null {
  if (session.cards.length === 0) return null;
  if (session.currentIndex >= session.cards.length) return null;
  return session.cards[session.currentIndex];
}

/**
 * Move to next card in session
 */
export function nextCard(session: StudySession): StudySession {
  const nextIndex = session.currentIndex + 1;

  return {
    ...session,
    currentIndex: Math.min(nextIndex, session.cards.length),
    isFlipped: false,
  };
}

/**
 * Move to previous card in session
 */
export function previousCard(session: StudySession): StudySession {
  const prevIndex = session.currentIndex - 1;

  return {
    ...session,
    currentIndex: Math.max(prevIndex, 0),
    isFlipped: false,
  };
}

/**
 * Toggle card flip state
 */
export function flipCard(session: StudySession): StudySession {
  return {
    ...session,
    isFlipped: !session.isFlipped,
  };
}

/**
 * Record a rating for the current card
 */
export function recordRating(session: StudySession, rating: Rating): StudySession {
  const currentCard = getCurrentCard(session);
  if (!currentCard) return session;

  const newStats = {
    ...session.sessionStats,
    cardsReviewed: session.sessionStats.cardsReviewed + 1,
    ratings: {
      ...session.sessionStats.ratings,
      [rating]: session.sessionStats.ratings[rating] + 1,
    },
  };

  return {
    ...session,
    completedCards: [...session.completedCards, currentCard.id],
    sessionStats: newStats,
  };
}

/**
 * Check if session is complete
 */
export function isSessionComplete(session: StudySession): boolean {
  return session.currentIndex >= session.cards.length;
}

/**
 * Complete the study session
 */
export function completeSession(session: StudySession): StudySession {
  return {
    ...session,
    sessionStats: {
      ...session.sessionStats,
      endTime: Date.now(),
    },
  };
}

/**
 * Get session progress as percentage
 */
export function getSessionProgress(session: StudySession): number {
  if (session.cards.length === 0) return 100;
  return Math.round((session.currentIndex / session.cards.length) * 100);
}

/**
 * Get remaining cards count
 */
export function getRemainingCards(session: StudySession): number {
  return Math.max(0, session.cards.length - session.currentIndex);
}

/**
 * Calculate session duration in seconds
 */
export function getSessionDuration(session: StudySession): number {
  const endTime = session.sessionStats.endTime || Date.now();
  return Math.floor((endTime - session.sessionStats.startTime) / 1000);
}

/**
 * Format session duration as readable string
 */
export function formatSessionDuration(session: StudySession): string {
  const seconds = getSessionDuration(session);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Shuffle cards for random study order
 */
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create a shuffled study session
 */
export function createShuffledSession(deckId: string, cards: Card[]): StudySession {
  return createStudySession(deckId, shuffleCards(cards));
}

/**
 * Filter cards to only due cards (cards without lastRating or with low rating)
 */
export function filterDueCards(cards: Card[]): Card[] {
  return cards.filter((card) => {
    // New cards are always due
    if (!card.lastRating) return true;
    // Cards rated "again" or "hard" are prioritized
    if (card.lastRating === "again" || card.lastRating === "hard") return true;
    return false;
  });
}

/**
 * Sort cards by priority (new cards first, then by last rating)
 */
export function sortCardsByPriority(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // New cards first
    if (!a.lastRating && b.lastRating) return -1;
    if (a.lastRating && !b.lastRating) return 1;

    // Then by rating priority (again > hard > good > easy)
    const ratingPriority: Record<Rating, number> = {
      again: 0,
      hard: 1,
      good: 2,
      easy: 3,
    };

    const aPriority = a.lastRating ? ratingPriority[a.lastRating] : -1;
    const bPriority = b.lastRating ? ratingPriority[b.lastRating] : -1;

    return aPriority - bPriority;
  });
}

/**
 * Get session summary for display
 */
export function getSessionSummary(session: StudySession): {
  cardsReviewed: number;
  accuracy: number;
  duration: string;
  ratingBreakdown: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
} {
  const { ratings, cardsReviewed } = session.sessionStats;
  const positiveRatings = ratings.good + ratings.easy;
  const accuracy = cardsReviewed > 0 ? Math.round((positiveRatings / cardsReviewed) * 100) : 0;

  return {
    cardsReviewed,
    accuracy,
    duration: formatSessionDuration(session),
    ratingBreakdown: { ...ratings },
  };
}
