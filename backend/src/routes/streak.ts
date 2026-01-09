import { Router, Response } from "express";
import { getFirestore } from "../config/firebase";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { StreakData } from "../types";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/streak
 * Get user's streak data from Firestore
 */
router.get("/", async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    const db = getFirestore();
    const streakDoc = await db.collection("users").doc(userId).collection("data").doc("streak").get();

    if (!streakDoc.exists) {
      // Return default streak data if none exists
      const defaultStreak: StreakData = {
        currentStreak: 0,
        bestStreak: 0,
        lastStudyDate: null,
        updatedAt: Date.now(),
      };
      return res.json({ streak: defaultStreak });
    }

    return res.json({ streak: streakDoc.data() as StreakData });
  } catch (error) {
    console.error("Error getting streak:", error);
    return res.status(500).json({ error: "Failed to get streak data" });
  }
});

/**
 * POST /api/streak/sync
 * Sync streak data - merges local and cloud streak (takes the better values)
 */
router.post("/sync", async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    const localStreak = req.body.streak as StreakData;
    if (!localStreak) {
      return res.status(400).json({ error: "Missing streak data" });
    }

    const db = getFirestore();
    const streakRef = db.collection("users").doc(userId).collection("data").doc("streak");
    const streakDoc = await streakRef.get();

    let mergedStreak: StreakData;

    if (!streakDoc.exists) {
      // No cloud data, use local data
      mergedStreak = {
        ...localStreak,
        updatedAt: Date.now(),
      };
    } else {
      const cloudStreak = streakDoc.data() as StreakData;

      // Merge strategy: take the best values
      mergedStreak = {
        currentStreak: Math.max(localStreak.currentStreak, cloudStreak.currentStreak),
        bestStreak: Math.max(localStreak.bestStreak, cloudStreak.bestStreak),
        // Use the most recent study date
        lastStudyDate: getMoreRecentDate(localStreak.lastStudyDate, cloudStreak.lastStudyDate),
        updatedAt: Date.now(),
      };
    }

    // Save merged streak to Firestore
    await streakRef.set(mergedStreak);

    return res.json({ streak: mergedStreak });
  } catch (error) {
    console.error("Error syncing streak:", error);
    return res.status(500).json({ error: "Failed to sync streak data" });
  }
});

/**
 * Helper function to get the more recent date string
 */
function getMoreRecentDate(date1: string | null, date2: string | null): string | null {
  if (!date1) return date2;
  if (!date2) return date1;
  return date1 > date2 ? date1 : date2;
}

export default router;
