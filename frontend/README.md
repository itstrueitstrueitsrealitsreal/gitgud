# GitGud Frontend

React frontend for the GitGud GitHub Developer Battle Arena.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173` with hot reload.

## Build for Production

```bash
npm run build
```

This creates a `dist` folder with the production build. The backend will serve these files.

## Environment Variables

Create a `.env` file (optional):
```
VITE_API_URL=http://localhost:3000
```

If not set, it defaults to `http://localhost:3000`.

## Features

- ⚔️ Compare two GitHub developers
- 🔥 AI-powered roasts for each developer
- 🏆 AI determines the winner with reasoning
- 🌐 Multi-language support with live translation
- 📊 Leaderboard tracking wins/losses
- 🎨 Modern, responsive UI
