# Personal Finance Dashboard 💰

A minimal full-stack Personal Finance Dashboard built for a 45-minute workshop. It features passwordless authentication using OTP via the **Minimoth API** (WhatsApp/SMS), real-time cash flow metrics, transaction logging, and monthly budget limits.

---

## 🎯 Workshop Scope & Constraints

* **Maximum 3 Frontend Pages**:
  1. `AuthPage`: Passwordless phone login & registration via Minimoth OTP.
  2. `DashboardPage`: Overview metrics (Net Balance, Income, Expenses), Add Transaction form, and Recent Transactions feed.
  3. `BudgetsPage`: Monthly spending limits tracker with visual progress bars.
* **Maximum 5 Backend API Endpoints**:
  1. `POST /api/auth/send-otp`: Dispatches OTP via Minimoth.
  2. `POST /api/auth/verify-otp`: Validates code, registers/authenticates user, returns token.
  3. `GET /api/dashboard`: Computes balances, transactions, and category budget progress.
  4. `POST /api/transactions`: Records an income or expense transaction.
  5. `POST /api/budgets`: Sets or updates a monthly category spending limit.
* **Maximum 3 Database Models (SQLite)**:
  1. `users` (`id`, `phone`, `name`, `created_at`)
  2. `transactions` (`id`, `user_id`, `title`, `amount`, `type`, `category`, `date`, `created_at`)
  3. `budgets` (`id`, `user_id`, `category`, `monthly_limit`, `created_at`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js** (v18+ recommended; Node 22/24 supported out of the box with built-in SQLite)
* **npm**

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env
cp .env.example .env
```

Open `backend/.env` and configure your settings:
```env
PORT=5000
MINIMOTH_API_KEY=your_minimoth_api_key_here
JWT_SECRET=super_secret_workshop_jwt_key
```

> **⚡ Minimoth Live vs Dev Mode:**
> * If you have a Minimoth API key, paste it into `MINIMOTH_API_KEY` to receive live WhatsApp/SMS OTP codes.
> * If `MINIMOTH_API_KEY` is not set or left as placeholder, the backend runs in **Workshop Dev Sandbox Mode**: enter OTP code **`123456`** to log in instantly.

Start the backend:
```bash
npm run dev
# Server runs on http://localhost:5000
```

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 📡 API Reference (5 Endpoints)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/send-otp` | No | Sends OTP to phone number using Minimoth API |
| `POST` | `/api/auth/verify-otp` | No | Verifies OTP code, returns auth token and user |
| `GET` | `/api/dashboard` | Bearer Token | Returns user metrics, transactions, and budgets |
| `POST` | `/api/transactions` | Bearer Token | Adds a new income or expense transaction |
| `POST` | `/api/budgets` | Bearer Token | Sets or updates a category budget limit |

---

## 📁 Project Structure

```
minimoth/
├── backend/
│   ├── .env               # Backend secrets & Minimoth API key
│   ├── .env.example       # Example template
│   ├── db.js              # SQLite database (3 models)
│   ├── server.js          # Express server (5 endpoints)
│   └── package.json
├── frontend/
│   ├── .env               # Frontend environment variables
│   ├── .env.example       # Example template
│   ├── vite.config.js     # Vite configuration with /api proxy
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx        # Root application & state
│       ├── App.css        # Minimalist fintech styling
│       ├── api.js         # API client
│       ├── components/
│       │   └── Navbar.jsx # Header navigation & user badge
│       └── pages/
│           ├── AuthPage.jsx       # Page 1: Minimoth OTP Auth
│           ├── DashboardPage.jsx  # Page 2: Metrics & Transactions
│           └── BudgetsPage.jsx    # Page 3: Monthly Budget Tracker
└── README.md
```

---

## 🛠️ Tech Stack

* **Frontend**: React 19 + Vite (Pure CSS modern styling)
* **Backend**: Node.js + Express
* **Database**: SQLite (Node built-in `node:sqlite`)
* **Auth**: OTP via [Minimoth API](https://minimoth.dev)
