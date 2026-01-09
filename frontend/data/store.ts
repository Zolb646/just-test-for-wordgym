import { useEffect, useState } from "react";
import * as queries from "./queries";

export type Rating = "again" | "hard" | "good" | "easy";

export type Card = {
  id: string;
  word: string;
  translation: string;
  lastRating?: Rating;
  nextReviewLabel?: string;
};

export type Deck = {
  id: string;
  name: string;
  cards: Card[];
  isFavorite: boolean;
};

type StoreState = {
  decks: Deck[];
  isLoaded: boolean;
};

const state: StoreState = {
  decks: [],
  isLoaded: false,
};

const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore<T>(selector: (store: StoreState) => T) {
  const [snapshot, setSnapshot] = useState(() => selector(state));

  useEffect(() => {
    return subscribe(() => setSnapshot(selector(state)));
  }, [selector]);

  return snapshot;
}

/**
 * Load all decks from database into the store
 * Should be called on app startup after database initialization
 */
export async function loadDecksFromDatabase() {
  try {
    const decks = await queries.getAllDecks();
    state.decks = decks;
    state.isLoaded = true;
    notify();
    console.log(`Loaded ${decks.length} decks from database`);
  } catch (error) {
    console.error("Failed to load decks from database:", error);
    state.isLoaded = true;
    notify();
  }
}

/**
 * Add a new deck (async - saves to database)
 */
export async function addDeck(name: string): Promise<Deck> {
  try {
    const deck = await queries.addDeck(name);
    state.decks = [deck, ...state.decks];
    notify();
    return deck;
  } catch (error) {
    console.error("Failed to add deck:", error);
    throw error;
  }
}

/**
 * Add a new card to a deck (async - saves to database)
 */
export async function addCard(
  deckId: string,
  word: string,
  translation: string
): Promise<Card | null> {
  try {
    const deckIndex = state.decks.findIndex((item) => item.id === deckId);
    if (deckIndex === -1) {
      console.error(`Deck not found: ${deckId}`);
      return null;
    }

    const card = await queries.addCard(deckId, word, translation);

    // Create new array references so React detects the change
    state.decks = state.decks.map((deck, index) => {
      if (index === deckIndex) {
        return {
          ...deck,
          cards: [card, ...deck.cards],
        };
      }
      return deck;
    });
    notify();

    return card;
  } catch (error) {
    console.error("Failed to add card:", error);
    throw error;
  }
}

/**
 * Rate a card (async - saves to database)
 */
export async function rateCard(
  deckId: string,
  cardId: string,
  rating: Rating
): Promise<Card | null> {
  try {
    const deckIndex = state.decks.findIndex((item) => item.id === deckId);
    if (deckIndex === -1) {
      console.error(`Deck not found: ${deckId}`);
      return null;
    }

    const deck = state.decks[deckIndex];
    const cardIndex = deck.cards.findIndex((item) => item.id === cardId);
    if (cardIndex === -1) {
      console.error(`Card not found: ${cardId}`);
      return null;
    }

    // Update in database
    const updatedCard = await queries.rateCard(cardId, rating);
    if (!updatedCard) {
      return null;
    }

    // Create new array references so React detects the change
    state.decks = state.decks.map((d, i) => {
      if (i === deckIndex) {
        return {
          ...d,
          cards: d.cards.map((c, j) => {
            if (j === cardIndex) {
              return {
                ...c,
                lastRating: updatedCard.lastRating,
                nextReviewLabel: updatedCard.nextReviewLabel,
              };
            }
            return c;
          }),
        };
      }
      return d;
    });
    notify();

    return state.decks[deckIndex].cards[cardIndex];
  } catch (error) {
    console.error("Failed to rate card:", error);
    throw error;
  }
}

/**
 * Toggle deck favorite status (async - saves to database)
 */
export async function toggleFavorite(deckId: string): Promise<boolean | null> {
  try {
    const deckIndex = state.decks.findIndex((item) => item.id === deckId);
    if (deckIndex === -1) {
      console.error(`Deck not found: ${deckId}`);
      return null;
    }

    const newFavoriteStatus = await queries.toggleFavorite(deckId);
    if (newFavoriteStatus === null) {
      return null;
    }

    // Create new array references so React detects the change
    state.decks = state.decks.map((deck, index) => {
      if (index === deckIndex) {
        return {
          ...deck,
          isFavorite: newFavoriteStatus,
        };
      }
      return deck;
    });
    notify();

    return newFavoriteStatus;
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    throw error;
  }
}

/**
 * Delete a deck (async - removes from database)
 */
export async function deleteDeck(deckId: string): Promise<boolean> {
  try {
    const success = await queries.deleteDeck(deckId);
    if (success) {
      state.decks = state.decks.filter((deck) => deck.id !== deckId);
      notify();
    }
    return success;
  } catch (error) {
    console.error("Failed to delete deck:", error);
    throw error;
  }
}

/**
 * Delete a card from a deck (async - removes from database)
 */
export async function deleteCard(deckId: string, cardId: string): Promise<boolean> {
  try {
    const success = await queries.deleteCard(cardId);
    if (success) {
      state.decks = state.decks.map((deck) => {
        if (deck.id === deckId) {
          return {
            ...deck,
            cards: deck.cards.filter((card) => card.id !== cardId),
          };
        }
        return deck;
      });
      notify();
    }
    return success;
  } catch (error) {
    console.error("Failed to delete card:", error);
    throw error;
  }
}

/**
 * Get current decks (for syncing)
 */
export function getDecks(): Deck[] {
  return state.decks;
}
