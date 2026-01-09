/**
 * Cloud sync service for WordGym
 * Handles manual synchronization with the backend API
 */

import * as api from "./api";
import { Deck } from "./store";
import { StreakDataRow } from "./schema";

export type SyncState = {
  isSyncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
};

export type SyncResult = {
  success: boolean;
  decks: Deck[];
  streak?: StreakDataRow;
  error?: string;
};

type SyncListener = (state: SyncState) => void;

// Sync state
const state: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  error: null,
};

const listeners = new Set<SyncListener>();

// Token storage (set by auth hook)
let authToken: string | null = null;

function notify() {
  for (const listener of listeners) {
    listener({ ...state });
  }
}

export function subscribeSyncState(listener: SyncListener) {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncState(): SyncState {
  return { ...state };
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Sync user profile data to cloud
 */
export async function syncUserToCloud(userData: {
  email: string;
  name?: string;
  imageUrl?: string;
}): Promise<boolean> {
  if (!authToken) {
    console.log("syncUserToCloud: No auth token");
    return false;
  }

  try {
    await api.syncUser(authToken, userData);
    console.log("User synced to cloud");
    return true;
  } catch (error) {
    console.error("Failed to sync user to cloud:", error);
    return false;
  }
}

/**
 * Export local data to cloud (manual sync - upload)
 */
export async function exportToCloud(
  decks: Deck[],
  streak?: { currentStreak: number; bestStreak: number; lastStudyDate: string | null }
): Promise<SyncResult> {
  if (!authToken) {
    return { success: false, decks, error: "Not signed in" };
  }

  if (state.isSyncing) {
    return { success: false, decks, error: "Sync already in progress" };
  }

  state.isSyncing = true;
  state.error = null;
  notify();

  try {
    console.log(`Exporting ${decks.length} decks to cloud...`);

    // Sync decks
    const deckResult = await api.syncDecks(authToken, decks);

    // Sync streak if provided
    if (streak) {
      try {
        await syncStreakToCloud(streak);
      } catch (error) {
        console.error("Failed to sync streak:", error);
      }
    }

    state.isSyncing = false;
    state.lastSyncAt = Date.now();
    state.error = null;
    notify();

    console.log("Export successful");
    return { success: true, decks: deckResult.decks };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Export failed";
    console.error("Export failed:", errorMessage);

    state.isSyncing = false;
    state.error = errorMessage;
    notify();

    return { success: false, decks, error: errorMessage };
  }
}

/**
 * Import data from cloud (manual sync - download)
 */
export async function importFromCloud(): Promise<SyncResult> {
  if (!authToken) {
    return { success: false, decks: [], error: "Not signed in" };
  }

  if (state.isSyncing) {
    return { success: false, decks: [], error: "Sync already in progress" };
  }

  state.isSyncing = true;
  state.error = null;
  notify();

  try {
    console.log("Importing from cloud...");

    // Load decks from cloud
    const deckResult = await api.getDecks(authToken);

    // Load streak from cloud
    let streak: StreakDataRow | undefined;
    try {
      const streakResult = await loadStreakFromCloud();
      if (streakResult) {
        streak = {
          id: 1,
          current_streak: streakResult.currentStreak,
          best_streak: streakResult.bestStreak,
          last_study_date: streakResult.lastStudyDate,
          updated_at: streakResult.updatedAt,
        };
      }
    } catch (error) {
      console.error("Failed to load streak:", error);
    }

    state.isSyncing = false;
    state.lastSyncAt = Date.now();
    state.error = null;
    notify();

    console.log(`Imported ${deckResult.decks.length} decks from cloud`);
    return { success: true, decks: deckResult.decks, streak };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Import failed";
    console.error("Import failed:", errorMessage);

    state.isSyncing = false;
    state.error = errorMessage;
    notify();

    return { success: false, decks: [], error: errorMessage };
  }
}

/**
 * Sync streak data to cloud
 */
async function syncStreakToCloud(streak: {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
}): Promise<void> {
  if (!authToken) return;

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

  await fetch(`${API_URL}/api/streak/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      streak: {
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        lastStudyDate: streak.lastStudyDate,
        updatedAt: Date.now(),
      },
    }),
  });
}

/**
 * Load streak data from cloud
 */
async function loadStreakFromCloud(): Promise<{
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  updatedAt: number;
} | null> {
  if (!authToken) return null;

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

  const response = await fetch(`${API_URL}/api/streak`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.streak;
}

/**
 * Delete user account and all data
 */
export async function deleteUserAccount(): Promise<boolean> {
  if (!authToken) {
    return false;
  }

  try {
    await api.deleteUser(authToken);
    return true;
  } catch (error) {
    console.error("Failed to delete account:", error);
    return false;
  }
}
