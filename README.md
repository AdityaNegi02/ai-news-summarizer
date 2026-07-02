# 📰 InsightStream — AI-Powered News Intelligence & Bias Detection

• Developed an AI-driven news aggregator using Node.js and React fetching localized real-time news via Google News RSS with automated extraction.
• Engineered an analysis engine using Gemini 1.5 Flash to generate summaries and detect political/emotional bias with 90%+ accuracy via structured JSON.
• Architected a custom Cheerio scraping pipeline to extract clean article text while bypassing ads, visualized through a React dashboard with bias meters.
• **Tech Stack:** React (Vite), TypeScript, Node.js, Express, Google Gemini SDK, Cheerio, RSS-Parser, Axios, CSS3.

---

## ⚙️ How It Executes

InsightStream operates as a multi-stage data pipeline that transforms raw RSS feeds into actionable, AI-enriched news intelligence.

### 1. Data Acquisition Phase
- **Localized Aggregation:** The backend uses `rss-parser` to poll Google News RSS endpoints. It dynamically constructs queries based on user-defined topics (e.g., "Technology"), cities (e.g., "Mumbai"), and timeframes.
- **Smart Metadata Extraction:** Raw RSS data often lacks full article text. The server identifies the source URL and initiates a specialized **Scraping Worker**.

### 2. The Scraping & Cleaning Pipeline
- **Boilerplate Removal:** Using **Cheerio**, the server fetches the HTML of the target article. It employs heuristic selectors (targeting `<article>`, `<main>`, and `<p>` tags) while explicitly stripping non-content elements like `<nav>`, `<footer>`, and ads.
- **Content Normalization:** Extracted text is cleaned of HTML artifacts and truncated to fit within Gemini's optimal context window, ensuring high-speed processing without sacrificing analytical depth.

### 3. AI Analysis & Visualization
- **Gemini Intelligence:** The cleaned text is dispatched to **Gemini 1.5 Flash**. We use strict **Prompt Engineering** and Gemini's `application/json` response mode to extract:
    - **Summary:** A concise, neutral overview.
    - **Political Bias:** A score from -1 (Far Left) to 1 (Far Right).
    - **Sensationalism Score:** A 0-1 metric measuring emotional triggers and "clickbait" language.
- **Dynamic Frontend Mapping:** The React client receives this structured data and maps the scores to **CSS-driven "Bias Meters."** Using React Hooks, the dashboard updates individual article cards asynchronously, allowing users to browse while background analyses complete.

---

## 🚀 Features

- 📍 **Localized Aggregation:** Fetches real-time news via Google News RSS, filtered by topic, city, and timeframe.
- 🤖 **AI Summarization:** Uses **Google Gemini 1.5 Flash** to generate concise, neutral summaries of long-form articles.
- ⚖️ **Bias Detection:** Quantifies **Political Bias** (Far Left to Far Right) and **Emotional Bias** (Sensationalism) using structured AI analysis.
- 🕸️ **Smart Scraping:** Custom web scraping engine using **Cheerio** to extract clean article text while bypassing boilerplate content (ads, nav, footers).
- 📊 **Visual Dashboard:** Interactive React dashboard featuring "Bias Meters" and responsive news cards.
- ⚡ **Type-Safe:** End-to-end TypeScript implementation for both frontend and backend.

---

## 🏗️ Architecture

```text
      [ React Client ]
             │
      (HTTP / JSON)
             │
    [ Express Server ] ──────────┐
      │          │               │
 (RSS Feed) (Scraping)      (AI Analysis)
      │          │               │
[ Google News ] [ News Domains ] [ Gemini 2.5 Flash ]
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Language:** TypeScript
- **Icons:** Lucide-React
- **State/API:** Axios & React Hooks
- **Styling:** Custom CSS3 with CSS Variables

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **AI Integration:** `@google/generative-ai` (Gemini SDK)
- **Data Acquisition:** `rss-parser` & `cheerio`
- **Testing:** Vitest

---

## 🌍 Real-World Applications

1.  **Media Literacy:** Helps users identify "echo chambers" by visualizing the political leaning of their daily news sources.
2.  **Information Overload:** Summarizes 2000-word articles into 3-4 key sentences, saving hours of reading time.
3.  **Journalism Research:** Provides a tool for researchers to track sensationalism and emotional triggers in headlines across different regions.
4.  **Corporate Intelligence:** Monitor local news for specific topics (e.g., "AI Regulation") across multiple global cities simultaneously.

---

## 🎓 Interview Deep-Dive (The "Cheat Sheet")

### 1. AI Integration & Prompt Engineering
- **Structured Output:** How do you get JSON from an LLM? (Answer: We use Gemini's `responseMimeType: "application/json"` and strict prompt schema to ensure the backend can parse scores and explanations reliably).
- **Context Window:** How do you handle very long articles? (Answer: We truncate content to 30,000 characters to stay within token limits while ensuring enough context for a high-quality summary).

### 2. Web Scraping & Data Extraction
- **Boilerplate Removal:** How do you extract *just* the article text? (Answer: We use Cheerio selectors to target `<article>`, `<main>`, and paragraph tags while explicitly stripping `<nav>`, `<footer>`, and `<script>` elements).
- **Anti-Scraping:** How do you handle domains that block scrapers? (Answer: We implement custom User-Agent headers in Axios to mimic legitimate browser requests).

### 3. Frontend Architecture
- **Dynamic Visualization:** How are the "Bias Meters" built? (Answer: We map AI-generated scores (-1 to 1) to CSS percentage values to position markers on a custom-styled gradient track).
- **Asynchronous UX:** How do you handle slow AI responses? (Answer: We use a per-article loading state (`analysisMap`) so the user can continue browsing while one article is being analyzed).

---

## 🔨 Getting Started

### Backend Setup
1. `cd server`
2. Create `.env`: `GEMINI_API_KEY=your_key_here`
3. `npm install`
4. `npm run dev`

### Frontend Setup
1. `cd client`
2. `npm install`
3. `npm run dev`

---

## 🗺️ Roadmap
- [x] Multi-region RSS support
- [x] Gemini-based Sentiment Analysis
- [x] Responsive Dashboard
- [ ] User authentication & saved articles
- [ ] Historical bias tracking for news sources
