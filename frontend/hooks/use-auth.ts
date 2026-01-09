/**
 * Auth hook wrapper for Clerk with cloud sync via backend API
 */

import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useCallback } from "react";
import * as api from "@/data/api";
import { Deck } from "@/data/store";

export type SyncResult = {
  success: boolean;
  decks: Deck[];
  error?: string;
};

export function useAuth() {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const { user } = useUser();

  /**
   * Get the current session token for API calls
   */
  const getSessionToken = useCallback(async () => {
    if (!isSignedIn) return null;
    return getToken();
  }, [isSignedIn, getToken]);

  /**
   * Sync user data to Firestore after sign in
   */
  const syncUserToCloud = useCallback(async () => {
    if (!isSignedIn || !user) return null;

    const token = await getToken();
    if (!token) return null;

    try {
      const result = await api.syncUser(token, {
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
      return result.user;
    } catch (error) {
      console.error("Failed to sync user:", error);
      return null;
    }
  }, [isSignedIn, user, getToken]);

  /**
   * Sync decks with backend (Firestore)
   * Merges local and cloud decks based on updatedAt timestamp
   */
  const syncDecksToCloud = useCallback(
    async (localDecks: Deck[]): Promise<SyncResult> => {
      if (!isSignedIn) {
        return { success: false, decks: localDecks, error: "Not signed in" };
      }

      const token = await getToken();
      if (!token) {
        return { success: false, decks: localDecks, error: "No auth token" };
      }

      try {
        const result = await api.syncDecks(token, localDecks);
        return { success: true, decks: result.decks };
      } catch (error) {
        console.error("Failed to sync decks:", error);
        return {
          success: false,
          decks: localDecks,
          error: error instanceof Error ? error.message : "Sync failed",
        };
      }
    },
    [isSignedIn, getToken]
  );

  /**
   * Load decks from cloud (Firestore via backend)
   */
  const loadDecksFromCloud = useCallback(async (): Promise<Deck[]> => {
    if (!isSignedIn) return [];

    const token = await getToken();
    if (!token) return [];

    try {
      const result = await api.getDecks(token);
      return result.decks;
    } catch (error) {
      console.error("Failed to load decks from cloud:", error);
      return [];
    }
  }, [isSignedIn, getToken]);

  /**
   * Delete user account and all data
   */
  const deleteAccount = useCallback(async () => {
    if (!isSignedIn) return false;

    const token = await getToken();
    if (!token) return false;

    try {
      await api.deleteUser(token);
      await signOut();
      return true;
    } catch (error) {
      console.error("Failed to delete account:", error);
      return false;
    }
  }, [isSignedIn, getToken, signOut]);

  return {
    isLoaded,
    isSignedIn,
    userId,
    user,
    getSessionToken,
    syncUserToCloud,
    syncDecksToCloud,
    loadDecksFromCloud,
    deleteAccount,
    signOut,
  };
}
