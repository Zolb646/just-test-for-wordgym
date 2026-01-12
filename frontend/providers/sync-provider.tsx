/**
 * Sync Provider - Handles manual cloud synchronization
 * Sets auth token when user signs in, provides import/export functions
 */

import { useEffect, useState, createContext, useContext } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { getDecks, importDecksFromCloud } from "@/data/store";
import { getStreakData } from "@/data/queries";
import {
  setAuthToken,
  syncUserToCloud,
  exportToCloud,
  importFromCloud,
  subscribeSyncState,
  SyncResult,
} from "@/data/sync-service";

type SyncContextType = {
  isSyncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
  exportToCloud: () => Promise<SyncResult>;
  importFromCloud: () => Promise<SyncResult>;
};

const SyncContext = createContext<SyncContextType>({
  isSyncing: false,
  lastSyncAt: null,
  error: null,
  exportToCloud: async () => ({ success: false, decks: [], error: "Not initialized" }),
  importFromCloud: async () => ({ success: false, decks: [], error: "Not initialized" }),
});

export function useSyncStatus() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    lastSyncAt: null as number | null,
    error: null as string | null,
  });

  // Subscribe to sync state changes
  useEffect(() => {
    return subscribeSyncState((state) => {
      setSyncState({
        isSyncing: state.isSyncing,
        lastSyncAt: state.lastSyncAt,
        error: state.error,
      });
    });
  }, []);

  // Set auth token when signed in (no automatic sync)
  useEffect(() => {
    async function handleAuthChange() {
      if (isSignedIn) {
        const token = await getToken();
        setAuthToken(token);

        // Sync user profile to cloud (just user info, not decks)
        if (user) {
          await syncUserToCloud({
            email: user.primaryEmailAddress?.emailAddress || "",
            name: user.fullName || undefined,
            imageUrl: user.imageUrl || undefined,
          });
        }
      } else {
        setAuthToken(null);
      }
    }

    handleAuthChange();
  }, [isSignedIn, user, getToken]);

  // Manual export function
  const handleExportToCloud = async (): Promise<SyncResult> => {
    if (!isSignedIn) {
      return { success: false, decks: [], error: "Not signed in" };
    }

    // Refresh token before sync
    const token = await getToken();
    setAuthToken(token);

    // Get current local data
    const decks = getDecks();
    const streakData = await getStreakData();

    // Export to cloud with streak
    return exportToCloud(
      decks,
      streakData
        ? {
            currentStreak: streakData.current_streak,
            bestStreak: streakData.best_streak,
            lastStudyDate: streakData.last_study_date,
          }
        : undefined
    );
  };

  // Manual import function
  const handleImportFromCloud = async (): Promise<SyncResult> => {
    if (!isSignedIn) {
      return { success: false, decks: [], error: "Not signed in" };
    }

    // Refresh token before sync
    const token = await getToken();
    setAuthToken(token);

    const result = await importFromCloud();

    // Save imported decks to local database/store
    if (result.success && result.decks.length > 0) {
      await importDecksFromCloud(result.decks);
    }

    return result;
  };

  return (
    <SyncContext.Provider
      value={{
        isSyncing: syncState.isSyncing,
        lastSyncAt: syncState.lastSyncAt,
        error: syncState.error,
        exportToCloud: handleExportToCloud,
        importFromCloud: handleImportFromCloud,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}
