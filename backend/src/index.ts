import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { initFirebase } from "./config/firebase";
import userRoutes from "./routes/user";
import deckRoutes from "./routes/decks";
import streakRoutes from "./routes/streak";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
initFirebase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/user", userRoutes);
app.use("/api/decks", deckRoutes);
app.use("/api/streak", streakRoutes);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
