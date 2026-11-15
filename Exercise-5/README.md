# AI Multi-Tool Assistant (Exercise #5)

A full-stack AI application powered by **Vercel AI SDK**, **Next.js 15 (App Router)**, **Tailwind CSS**, and **Prisma ORM** connected to **Neon Serverless PostgreSQL**.

This application solves **Exercise #5: Database Chat, Movie Database & Dad Jokes Tools** from the *Professional AI Engineer Track*.

---

## 🚀 Features

### 1. 🗄️ Database Chat Tool (Part 1 & Part 4)
* **Natural Language to SQL**: Converts natural language requests into safe, read-only SQL queries (`SELECT`).
* **Database Schema**:
  * **`Movie`**: id, title, year, genre, rating, director, description
  * **`User`**: id, name, email, age, favorite_genre
  * **`Review`**: id, movie_id, user_id, rating, comment, date
* **Security & Validation**: Strict read-only SQL validator blocking `DROP`, `DELETE`, `UPDATE`, `INSERT`, and SQL injection attacks.
* **Sample Queries Handled**:
  * *"Show me all sci-fi movies"*
  * *"Find users over 25"*
  * *"Get movies with rating above 8.5"*
  * *"Count total movies by genre"*

### 2. 🎬 Movie Database Tool (Part 2)
* **OMDb API Integration**: Fetches detailed movie information (Plot, Cast/Actors, Ratings, Posters, Runtime).
* **Search by Title and Year**: Handles specific queries and partial matches.
* **Intelligent Caching**: Automatically stores fetched movies in the database (`CachedMovie`) to eliminate redundant API calls and optimize performance.
* **Recommendations**: Suggests similar high-rated movies based on genre.
* **Error Handling & Fallback**: Handles *"Movie not found"* and gracefully falls back to local database entries if the external API fails.

### 3. 🥸 Dad Jokes Tool (Part 3)
* **icanhazdadjoke API**: Fetches real-time random jokes with `Accept: application/json`.
* **Categories**: Supports `dad`, `programming`, and `general` jokes.
* **Keyword Search**: Finds jokes relevant to user-specified keywords.
* **Offline Access & Fallback**: Stores jokes in the local database (`CachedJoke`); falls back to local jokes if offline.
* **Interactive Rating System**: Interactive **Thumbs Up** and **Thumbs Down** buttons that update database vote counts in real time.

### 4. 🎨 Frontend UI (Part 5)
* **Tables**: Renders database query results as styled, responsive tables with row counts and query execution times.
* **Movie Cards**: Displays rich cards with movie posters, ratings tags, director, cast, and recommendation quick-links.
* **Styled Jokes**: Quote-styled joke cards with live thumbs up/down voting counters.
* **Loading & Error UI**: Animated loading states, friendly error messages, and retry capabilities.
* **Clear & Reset**: One-click reset button to purge conversation history.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 15 (App Router) + React 19
* **Styling**: Tailwind CSS + Lucide React Icons
* **Database**: Neon PostgreSQL via Prisma ORM
* **APIs**: OMDb API (`omdbapi.com`), icanhazdadjoke (`icanhazdadjoke.com`)
* **Testing**: Node.js Test Runner (`node:test`)

---

## 📦 Setup Instructions

### 1. Prerequisites
* Node.js v18+ (tested on Node.js v26)
* A Neon PostgreSQL connection string

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-muddy-fog-...pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:password@ep-muddy-fog-...neon.tech/neondb?sslmode=require"
OMDB_API_KEY="561d8e0a"
GEMINI_API_KEY="your-gemini-key"
```

### 3. Database Push & Seeding
Push the Prisma schema to Neon PostgreSQL and seed it with realistic sample data:
```bash
npx prisma db push
node prisma/seed.js
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests
Run the comprehensive unit test suite:
```bash
npm test
```

---

## 🔍 Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **P1001: Can't reach database server** | SSL or connection pooling issue with Neon | Ensure `sslmode=require` is present in the `DATABASE_URL` query string. |
| **Movie not found on OMDb** | Movie title typo or unindexed title | Ensure correct spelling or use the year parameter (e.g. `Inception 2010`). Local fallback will trigger automatically if available. |
| **icanhazdadjoke API timeout** | Network outage or API rate limit | The app will automatically fallback to pre-seeded local database jokes without throwing an unhandled exception. |
| **Security Violation on DB Query** | Non-SELECT query attempted | The security validator only permits `SELECT` statements to safeguard database integrity. |
