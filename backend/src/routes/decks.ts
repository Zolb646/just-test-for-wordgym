import { Router, Response } from "express";
import { getFirestore } from "../config/firebase";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { Deck, Card } from "../types";

const router = Router();

/**
 * GET /api/decks
 * Get all decks for the authenticated user
 */
router.get("/", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const db = getFirestore();

    const snapshot = await db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .orderBy("updatedAt", "desc")
      .get();

    const decks: Deck[] = snapshot.docs.map((doc) => doc.data() as Deck);
    res.json({ decks });
  } catch (error) {
    console.error("Error getting decks:", error);
    res.status(500).json({ error: "Failed to get decks" });
  }
});

/**
 * GET /api/decks/:id
 * Get a single deck by ID
 */
router.get("/:id", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const db = getFirestore();

    const doc = await db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(id)
      .get();

    if (!doc.exists) {
      res.status(404).json({ error: "Deck not found" });
      return;
    }

    res.json({ deck: doc.data() });
  } catch (error) {
    console.error("Error getting deck:", error);
    res.status(500).json({ error: "Failed to get deck" });
  }
});

/**
 * POST /api/decks
 * Create a new deck
 */
router.post("/", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id, name, cards = [], isFavorite = false } = req.body;
    const db = getFirestore();

    if (!id || !name) {
      res.status(400).json({ error: "id and name are required" });
      return;
    }

    const now = Date.now();
    const deck: Deck = {
      id,
      name,
      cards,
      isFavorite,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(id)
      .set(deck);

    res.status(201).json({ deck });
  } catch (error) {
    console.error("Error creating deck:", error);
    res.status(500).json({ error: "Failed to create deck" });
  }
});

/**
 * PUT /api/decks/:id
 * Update a deck
 */
router.put("/:id", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { name, cards, isFavorite } = req.body;
    const db = getFirestore();

    const deckRef = db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(id);

    const doc = await deckRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Deck not found" });
      return;
    }

    const updates: Partial<Deck> = { updatedAt: Date.now() };
    if (name !== undefined) updates.name = name;
    if (cards !== undefined) updates.cards = cards;
    if (isFavorite !== undefined) updates.isFavorite = isFavorite;

    await deckRef.update(updates);

    const updated = await deckRef.get();
    res.json({ deck: updated.data() });
  } catch (error) {
    console.error("Error updating deck:", error);
    res.status(500).json({ error: "Failed to update deck" });
  }
});

/**
 * DELETE /api/decks/:id
 * Delete a deck
 */
router.delete("/:id", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const db = getFirestore();

    await db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(id)
      .delete();

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting deck:", error);
    res.status(500).json({ error: "Failed to delete deck" });
  }
});

/**
 * POST /api/decks/sync
 * Sync local decks with cloud - merges based on updatedAt timestamp
 * Body: { decks: Deck[] }
 * Returns: { decks: Deck[] } - the merged result
 */
router.post("/sync", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { decks: localDecks } = req.body as { decks: Deck[] };
    const db = getFirestore();

    if (!Array.isArray(localDecks)) {
      res.status(400).json({ error: "decks array is required" });
      return;
    }

    const userDecksRef = db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks");

    // Get all cloud decks
    const snapshot = await userDecksRef.get();
    const cloudDecks = new Map<string, Deck>();
    snapshot.docs.forEach((doc) => {
      const deck = doc.data() as Deck;
      cloudDecks.set(deck.id, deck);
    });

    // Merge logic: newer updatedAt wins
    const merged = new Map<string, Deck>();
    const batch = db.batch();

    // Process cloud decks first
    for (const [id, cloudDeck] of cloudDecks) {
      merged.set(id, cloudDeck);
    }

    // Process local decks - overwrite if newer
    for (const localDeck of localDecks) {
      const cloudDeck = cloudDecks.get(localDeck.id);
      const localTime = localDeck.updatedAt || 0;
      const cloudTime = cloudDeck?.updatedAt || 0;

      if (!cloudDeck || localTime > cloudTime) {
        // Local is newer or doesn't exist in cloud - use local
        const deckToSave: Deck = {
          ...localDeck,
          updatedAt: localDeck.updatedAt || Date.now(),
          createdAt: localDeck.createdAt || cloudDeck?.createdAt || Date.now(),
        };
        merged.set(localDeck.id, deckToSave);
        batch.set(userDecksRef.doc(localDeck.id), deckToSave);
      }
      // else: cloud is newer, already in merged
    }

    await batch.commit();

    const finalDecks = Array.from(merged.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    res.json({ decks: finalDecks });
  } catch (error) {
    console.error("Error syncing decks:", error);
    res.status(500).json({ error: "Failed to sync decks" });
  }
});

/**
 * POST /api/decks/:id/cards
 * Add a card to a deck
 */
router.post("/:id/cards", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id: deckId } = req.params;
    const { id, word, translation } = req.body;
    const db = getFirestore();

    if (!id || !word || !translation) {
      res.status(400).json({ error: "id, word, and translation are required" });
      return;
    }

    const deckRef = db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(deckId);

    const doc = await deckRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Deck not found" });
      return;
    }

    const deck = doc.data() as Deck;
    const newCard: Card = {
      id,
      word,
      translation,
      updatedAt: Date.now(),
    };

    deck.cards = [newCard, ...deck.cards];
    deck.updatedAt = Date.now();

    await deckRef.update({ cards: deck.cards, updatedAt: deck.updatedAt });

    res.status(201).json({ card: newCard, deck });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ error: "Failed to add card" });
  }
});

/**
 * PUT /api/decks/:deckId/cards/:cardId
 * Update a card (e.g., after rating)
 */
router.put("/:deckId/cards/:cardId", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { deckId, cardId } = req.params;
    const { word, translation, lastRating, nextReviewLabel } = req.body;
    const db = getFirestore();

    const deckRef = db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(deckId);

    const doc = await deckRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Deck not found" });
      return;
    }

    const deck = doc.data() as Deck;
    const cardIndex = deck.cards.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const updatedCard: Card = {
      ...deck.cards[cardIndex],
      updatedAt: Date.now(),
    };

    if (word !== undefined) updatedCard.word = word;
    if (translation !== undefined) updatedCard.translation = translation;
    if (lastRating !== undefined) updatedCard.lastRating = lastRating;
    if (nextReviewLabel !== undefined) updatedCard.nextReviewLabel = nextReviewLabel;

    deck.cards[cardIndex] = updatedCard;
    deck.updatedAt = Date.now();

    await deckRef.update({ cards: deck.cards, updatedAt: deck.updatedAt });

    res.json({ card: updatedCard, deck });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Failed to update card" });
  }
});

/**
 * DELETE /api/decks/:deckId/cards/:cardId
 * Delete a card from a deck
 */
router.delete("/:deckId/cards/:cardId", requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { deckId, cardId } = req.params;
    const db = getFirestore();

    const deckRef = db
      .collection("users")
      .doc(authReq.userId)
      .collection("decks")
      .doc(deckId);

    const doc = await deckRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Deck not found" });
      return;
    }

    const deck = doc.data() as Deck;
    deck.cards = deck.cards.filter((c) => c.id !== cardId);
    deck.updatedAt = Date.now();

    await deckRef.update({ cards: deck.cards, updatedAt: deck.updatedAt });

    res.json({ success: true, deck });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

export default router;
