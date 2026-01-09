import { Platform } from "react-native";

type SQLiteDatabase = any;

let db: SQLiteDatabase | null = null;
const isWeb = Platform.OS === "web";

// Lazy load expo-sqlite only on native platforms
let SQLite: any = null;

/**
 * Initialize the SQLite database and create tables if they don't exist
 * Note: SQLite is only available on iOS/Android. On web, returns a mock database.
 */
export async function initDatabase(): Promise<SQLiteDatabase | null> {
  if (isWeb) {
    console.log("Running on web - skipping SQLite initialization");
    console.warn("Warning: Data persistence is disabled on web platform");
    return null;
  }

  if (!db) {
    console.log("Initializing WordGym database...");

    // Load expo-sqlite only when needed (on native platforms)
    if (!SQLite) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require("expo-sqlite");
      SQLite = module.openDatabaseAsync || module.default?.openDatabaseAsync;

      if (!SQLite) {
        throw new Error("Failed to load openDatabaseAsync from expo-sqlite");
      }
    }

    db = await SQLite("wordgym.db");
    await createTables();
    console.log("Database initialized successfully");
  }
  return db;
}

/**
 * Create database tables and indexes
 */
async function createTables() {
  if (!db) throw new Error("Database not initialized");

  // Create decks table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Migration: Add is_favorite column if it doesn't exist (for existing databases)
  try {
    await db.execAsync(`ALTER TABLE decks ADD COLUMN is_favorite INTEGER DEFAULT 0;`);
  } catch {
    // Column already exists, ignore error
  }

  // Create cards table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      word TEXT NOT NULL,
      translation TEXT NOT NULL,
      last_rating TEXT,
      next_review_date INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review_date);
  `);

  // Create study_sessions table for tracking daily activity
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      cards_studied INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Create index for study_sessions date lookup
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
  `);

  // Create streak_data table (single row table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS streak_data (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      last_study_date TEXT,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Initialize streak_data with a single row if it doesn't exist
  await db.execAsync(`
    INSERT OR IGNORE INTO streak_data (id, current_streak, best_streak) VALUES (1, 0, 0);
  `);

  console.log("Database tables and indexes created");
}

/**
 * Get the database instance
 * @throws Error if database is not initialized or running on web
 */
export function getDatabase(): SQLiteDatabase {
  if (isWeb) {
    throw new Error("SQLite is not available on web platform");
  }
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Close the database connection (useful for cleanup)
 */
export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log("Database connection closed");
  }
}

/**
 * Delete all data from the database (useful for testing/reset)
 */
export async function clearDatabase() {
  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM cards;
    DELETE FROM decks;
    DELETE FROM study_sessions;
    UPDATE streak_data SET current_streak = 0, best_streak = 0, last_study_date = NULL WHERE id = 1;
  `);
  console.log("Database cleared");
}
