/**
 * Database schema definitions and types for WordGym
 */

import { Rating } from "./store";

/**
 * Database row type for decks table
 */
export type DeckRow = {
  id: string;
  name: string;
  is_favorite: number; // 0 = false, 1 = true (SQLite uses integers for booleans)
  created_at: number;
};

/**
 * Database row type for cards table
 */
export type CardRow = {
  id: string;
  deck_id: string;
  word: string;
  translation: string;
  last_rating: Rating | null;
  next_review_date: number | null;
  created_at: number;
};

/**
 * Database row type for study_sessions table
 */
export type StudySessionRow = {
  id: string;
  date: string; // YYYY-MM-DD format
  cards_studied: number;
  created_at: number;
};

/**
 * Database row type for streak_data table
 */
export type StreakDataRow = {
  id: number;
  current_streak: number;
  best_streak: number;
  last_study_date: string | null; // YYYY-MM-DD format
  updated_at: number;
};

/**
 * Review intervals in seconds for each rating
 */
export const REVIEW_INTERVALS = {
  again: 60, // 1 minute
  hard: 480, // 8 minutes
  good: 900, // 15 minutes
  easy: 259200, // 3 days
} as const;

/**
 * Calculate next review date timestamp based on rating
 */
export function calculateNextReviewDate(rating: Rating): number {
  const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
  const interval = REVIEW_INTERVALS[rating];
  return now + interval;
}

/**
 * Format review interval as human-readable label
 */
export function formatReviewLabel(rating: Rating): string {
  switch (rating) {
    case "again":
      return "1m";
    case "hard":
      return "8m";
    case "good":
      return "15m";
    case "easy":
      return "3d";
  }
}

/**
 * Convert Unix timestamp to Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Check if a card is due for review
 */
export function isCardDueForReview(nextReviewDate: number | null): boolean {
  if (!nextReviewDate) return true; // Cards without review date are due
  const now = Math.floor(Date.now() / 1000);
  return now >= nextReviewDate;
}
