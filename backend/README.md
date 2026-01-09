# WordGym Backend

Express.js backend with Clerk authentication and Firebase for user storage.

**Note:** Decks are stored locally on the device (SQLite). This backend only handles user authentication.

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Set up Clerk

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your API keys from the Clerk Dashboard

### 3. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Copy the values to your `.env` file

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Server
PORT=3000
```

### 5. Run the server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

### User Routes (requires authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/sync` | Sync user data to Firebase |
| GET | `/api/user/me` | Get current user |
| DELETE | `/api/user/me` | Delete user account |

## Firebase Structure

```
users/
  {clerkUserId}/
    - id: string
    - email: string
    - name: string
    - imageUrl: string
    - createdAt: number
    - lastLoginAt: number
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend      │     │    Firebase     │
│   (Expo)        │────▶│   (Express)     │────▶│   (Firestore)   │
│                 │     │                 │     │                 │
│  SQLite (decks) │     │  Clerk Auth     │     │  User data      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Decks** are stored locally in SQLite (offline-first)
- **Users** are authenticated via Clerk and stored in Firebase
- **Export/Import** is done offline via JSON files
