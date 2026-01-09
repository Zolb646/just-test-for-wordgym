import { Router, Response } from "express";
import { getFirestore } from "../config/firebase";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { User } from "../types";

const router = Router();

/**
 * POST /api/user/sync
 * Sync user data from Clerk to Firebase
 */
router.post("/sync", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { email, name, imageUrl } = req.body;

    const db = getFirestore();
    const userRef = db.collection("users").doc(authReq.userId);
    const userDoc = await userRef.get();

    const now = Date.now();

    if (userDoc.exists) {
      // Update existing user
      await userRef.update({
        email,
        name,
        imageUrl,
        lastLoginAt: now,
      });
    } else {
      // Create new user
      const newUser: User = {
        id: authReq.userId,
        email,
        name,
        imageUrl,
        createdAt: now,
        lastLoginAt: now,
      };
      await userRef.set(newUser);
    }

    const updatedDoc = await userRef.get();
    res.json({ user: updatedDoc.data() });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

/**
 * GET /api/user/me
 * Get current user data from Firebase
 */
router.get("/me", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const db = getFirestore();
    const userDoc = await db.collection("users").doc(authReq.userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: userDoc.data() });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * DELETE /api/user/me
 * Delete user and all their data
 */
router.delete("/me", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const db = getFirestore();
    const batch = db.batch();

    // Delete user document
    batch.delete(db.collection("users").doc(authReq.userId));

    // Delete user's decks
    const decksSnapshot = await db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .get();

    decksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
