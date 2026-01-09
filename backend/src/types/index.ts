export interface User {
  id: string; // Clerk user ID
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface Card {
  id: string;
  word: string;
  translation: string;
  lastRating?: Rating;
  nextReviewLabel?: string;
  updatedAt?: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  updatedAt: number;
}

export interface StudySession {
  date: string;
  cardsStudied: number;
}
