# Silens

A focused poetry writing app for iOS and Android. Write poems and save them directly to your Notion database, with a clean library to browse everything you've written.

## Features

- Distraction-free poem editor with title, content, and live word/character count
- Save poems directly to Notion with one tap
- Library screen with fuzzy search across titles and content
- Read poems in a full-screen viewer
- Warm, paper-toned design with Libre Baskerville typography
- Haptic feedback and smooth animations throughout

## Tech Stack

- **Framework**: React Native + Expo (Expo Router)
- **Language**: TypeScript
- **Backend**: Notion API
- **UI**: Custom StyleSheet, Libre Baskerville font, Lucide icons
- **Animations**: React Native Reanimated

## Prerequisites

- Node.js 18+
- Expo CLI (`pnpm install -g expo-cli`)
- A Notion integration token and database ID
- iOS Simulator / Android Emulator or a physical device with Expo Go

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/darshan-regmi/silens.git
   cd silens
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure your Notion credentials in `utils/storage.ts` — add your integration token and database ID.

4. Start the dev server:
   ```bash
   pnpm run dev
   ```

5. Scan the QR code with Expo Go, or press `i` for iOS / `a` for Android.

## Project Structure

```
silens/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Write screen
│   │   └── library.tsx     # Poem library with search
│   ├── poem/[id].tsx       # Full-screen poem reader
│   └── _layout.tsx
├── components/
├── hooks/
└── utils/
    └── storage.ts          # Notion API integration
```

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start Expo dev server |
| `pnpm run ios` | Run on iOS |
| `pnpm run android` | Run on Android |
| `pnpm run build:web` | Export for web |
