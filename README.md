This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Amazon Book Leaderboard

A Next.js application that scrapes Amazon paperback books and displays them ranked by Best Sellers Rank (BSR). Features automated daily scraping and publishing.

## 📊 Features

- **Automated Scraping**: Daily scraping of Amazon book data at 00:00 UTC
- **Smart Ranking**: Books sorted by BSR (lower numbers = better performance)
- **Retry Logic**: Robust error handling with exponential backoff
- **Modern UI**: Clean, responsive interface with Material Design
- **Real-time Data**: Fresh data updated daily

## 🛠️ Development

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Data Management
npm run scrape       # Run scraper manually
npm run publish      # Run publisher manually
npm run cycle:now    # Run full cycle (scrape + publish) immediately

# Scheduling
npm run scheduler    # Start the daily scheduler
npm run start:prod   # Start production with scheduler (for Railway)
```

## 🕐 Scheduling

The application includes an automated scheduler that runs daily at **00:00 UTC**:

1. **Scrapes** fresh book data from Amazon
2. **Publishes** sorted results to the leaderboard
3. **Retries** on failure with exponential backoff

### Manual Execution

To run the cycle immediately:
```bash
npm run cycle:now
```

To start the scheduler locally:
```bash
npm run scheduler
```

## 🚀 Production Deployment

For Railway deployment, use:
```bash
npm run start:prod
```

This starts both the Next.js app and the daily scheduler.

### Railway: Chromium in the same service

The scraper uses Puppeteer with **system Chromium** on Railway so you don’t need a separate browser service:

- **`nixpacks.toml`** installs the `chromium` Nix package and sets `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1`.
- At runtime the app uses `chromium` from PATH on Linux (or `PUPPETEER_EXECUTABLE_PATH` if you set it).

If the build still downloads Puppeteer’s Chromium (slower, larger image), add a **build** variable in the Railway dashboard:

- **Variable:** `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`
- **Value:** `1`

Then redeploy so the install step skips the bundled Chromium and uses Nix’s Chromium only.

## 📁 Project Structure

```
├── lib/           # Core business logic
│   ├── cycle.ts   # Daily cycle (scrape + publish)
│   ├── scheduler.ts # Cron scheduling
│   ├── scraper.ts # Amazon scraping logic
│   └── publisher.ts # Data processing & sorting
├── scripts/       # Executable scripts
├── src/           # Next.js application
└── data/          # Generated data files
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
