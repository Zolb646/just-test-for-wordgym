/**
 * WordGym Data Layer
 *
 * This module provides a complete data management solution including:
 * - Database initialization and lifecycle (database.ts)
 * - Type definitions and schema utilities (schema.ts)
 * - CRUD operations for decks and cards (queries.ts)
 * - State management with React hooks (store.ts)
 * - Input validation utilities (validation.ts)
 * - Statistics and analytics (statistics.ts)
 * - Study session management (study.ts)
 * - Data export/import (export.ts)
 */

// Database lifecycle
export {
  initDatabase,
  getDatabase,
  closeDatabase,
  clearDatabase,
} from "./database";

// Schema types and utilities
export {
  type DeckRow,
  type CardRow,
  type StreakDataRow,
  type StudySessionRow,
  REVIEW_INTERVALS,
  calculateNextReviewDate,
  formatReviewLabel,
  timestampToDate,
  isCardDueForReview,
} from "./schema";

// CRUD queries
export {
  getAllDecks,
  getDeckById,
  addDeck as addDeckQuery,
  updateDeck,
  deleteDeck,
  getCardsByDeckId,
  getCardById,
  addCard as addCardQuery,
  updateCard,
  rateCard as rateCardQuery,
  deleteCard,
  getDueCards,
  getCardCount,
  // Streak queries
  getStreakData,
  recordStudySession,
  getWeeklyActivity,
  getCardsStudiedToday,
} from "./queries";

// Store and state management
export {
  type Rating,
  type Card,
  type Deck,
  subscribe,
  useStore,
  loadDecksFromDatabase,
  addDeck,
  addCard,
  rateCard,
} from "./store";

// Validation utilities
export {
  type ValidationResult,
  validateDeckName,
  validateCardWord,
  validateCardTranslation,
  validateCard,
  validateRating,
  validateId,
  sanitizeString,
  sanitizeDeckName,
  sanitizeCardContent,
} from "./validation";

// Statistics and analytics
export {
  type DeckStats,
  type RatingDistribution,
  type AppStats,
  getDeckStats,
  getRatingDistribution,
  getAppStats,
  calculateDeckStatsFromMemory,
  calculateRatingDistributionFromMemory,
} from "./statistics";

// Study session management
export {
  type StudySession,
  type SessionStats,
  createStudySession,
  getCurrentCard,
  nextCard,
  previousCard,
  flipCard,
  recordRating,
  isSessionComplete,
  completeSession,
  getSessionProgress,
  getRemainingCards,
  getSessionDuration,
  formatSessionDuration,
  shuffleCards,
  createShuffledSession,
  filterDueCards,
  sortCardsByPriority,
  getSessionSummary,
} from "./study";

// Export/Import utilities
export {
  type ExportFormat,
  type ExportData,
  type ExportedDeck,
  type ExportedCard,
  type ImportResult,
  exportToJSON,
  exportDeckToJSON,
  exportToCSV,
  exportDeckToCSV,
  parseJSONImport,
  parseCSVImport,
  generateExportFilename,
} from "./export";

// Cloud sync (via backend API)
export {
  type SyncResult,
  type SyncState,
  exportToCloud,
  importFromCloud,
  subscribeSyncState,
  setAuthToken,
} from "./sync-service";
