/**
 * API client for WordGym backend
 * Handles user authentication and deck sync with Firestore
 */

import { Deck } from "./store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ==================== User API ====================

export async function syncUser(
  token: string,
  userData: { email: string; name?: string; imageUrl?: string }
) {
  return apiFetch<{ user: unknown }>("/api/user/sync", {
    method: "POST",
    body: userData,
    token,
  });
}

export async function getUser(token: string) {
  return apiFetch<{ user: unknown }>("/api/user/me", { token });
}

export async function deleteUser(token: string) {
  return apiFetch<{ success: boolean }>("/api/user/me", {
    method: "DELETE",
    token,
  });
}

// ==================== Decks API ====================

export async function getDecks(token: string) {
  return apiFetch<{ decks: Deck[] }>("/api/decks", { token });
}

export async function syncDecks(token: string, decks: Deck[]) {
  return apiFetch<{ decks: Deck[] }>("/api/decks/sync", {
    method: "POST",
    body: { decks },
    token,
  });
}

export async function createDeck(
  token: string,
  deck: { id: string; name: string; cards?: unknown[]; isFavorite?: boolean }
) {
  return apiFetch<{ deck: Deck }>("/api/decks", {
    method: "POST",
    body: deck,
    token,
  });
}

export async function updateDeck(
  token: string,
  deckId: string,
  updates: { name?: string; cards?: unknown[]; isFavorite?: boolean }
) {
  return apiFetch<{ deck: Deck }>(`/api/decks/${deckId}`, {
    method: "PUT",
    body: updates,
    token,
  });
}

export async function deleteDeck(token: string, deckId: string) {
  return apiFetch<{ success: boolean }>(`/api/decks/${deckId}`, {
    method: "DELETE",
    token,
  });
}

// ==================== Offline Export/Import ====================

export type ExportData = {
  version: string;
  exportedAt: string;
  decks: {
    name: string;
    isFavorite: boolean;
    cards: { word: string; translation: string; lastRating?: string }[];
  }[];
};

/**
 * Export decks to JSON string (offline - no server needed)
 */
export function exportDecksOffline(decks: Deck[]): string {
  const exportData: ExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    decks: decks.map((deck) => ({
      name: deck.name,
      isFavorite: deck.isFavorite,
      cards: deck.cards.map((card) => ({
        word: card.word,
        translation: card.translation,
        lastRating: card.lastRating,
      })),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Parse imported JSON data (offline - no server needed)
 */
export function parseImportData(jsonString: string): {
  success: boolean;
  data?: ExportData;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);

    if (!data.decks || !Array.isArray(data.decks)) {
      return { success: false, error: "Invalid format: missing decks array" };
    }

    return { success: true, data: data as ExportData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

/**
 * Convert imported data to Deck objects
 */
export function importDataToDecks(data: ExportData): Deck[] {
  const now = Date.now();

  return data.decks.map((exportedDeck, deckIndex) => ({
    id: `${now}-${deckIndex}`,
    name: exportedDeck.name,
    isFavorite: exportedDeck.isFavorite || false,
    cards: exportedDeck.cards.map((card, cardIndex) => ({
      id: `${now}-${deckIndex}-${cardIndex}`,
      word: card.word,
      translation: card.translation,
      lastRating: card.lastRating as "again" | "hard" | "good" | "easy" | undefined,
    })),
  }));
}
