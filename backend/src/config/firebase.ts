import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let db: admin.firestore.Firestore;

export function initFirebase() {
  if (admin.apps.length === 0) {
    // Option 1: Use service account JSON file
    const serviceAccountPath = join(__dirname, "../../service-account.json");

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase initialized with service account file");
    }
    // Option 2: Use base64-encoded service account (easiest for deployment)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8");
      const serviceAccount = JSON.parse(decoded);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase initialized with base64 service account");
    }
    // Option 3: Use individual environment variables
    else if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log("Firebase initialized with env variables");
    }
    // No credentials found
    else {
      throw new Error(
        "Missing Firebase credentials. Options:\n" +
        "1. Add service-account.json file\n" +
        "2. Set FIREBASE_SERVICE_ACCOUNT_BASE64 (base64 encoded JSON)\n" +
        "3. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }
  }

  db = admin.firestore();
}

export function getFirestore() {
  if (!db) {
    throw new Error("Firebase not initialized");
  }
  return db;
}

export { admin };
