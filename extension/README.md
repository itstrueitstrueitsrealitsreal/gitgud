# GitGud Chrome Extension

The GitGud Chrome extension frontend - analyzes GitHub profiles and generates comedic roasts with AI.

## Structure

```
extension/
├── manifest.json          # Chrome extension manifest (v3)
├── background/
│   └── background.js      # Service worker for API calls
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── content/
│   └── content.js        # Content script for GitHub pages
└── assets/
    └── (icons)           # Extension icons
```

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` directory
5. The extension should now appear in your extensions list

### Configuration

By default, the extension expects the backend to be running at `http://localhost:3000`.

To change the backend URL:

1. Open extension popup
2. The URL can be configured via `chrome.storage.local`
3. Or update `DEFAULT_BACKEND_URL` in `background/background.js`

## Usage

### Via Extension Popup

1. Click the GitGud extension icon in Chrome toolbar
2. Enter a GitHub username (or it will auto-fill if you're on a GitHub profile)
3. Select roast intensity (mild/medium/spicy)
4. Click "🔥 Roast Me"
5. View results and click "🔊 Speak Roast" to hear it aloud

### Via GitHub Page Button

1. Navigate to any GitHub user profile (e.g., `github.com/octocat`)
2. Look for the "🔥 Roast This Dev" button near the profile navigation
3. Click it to save the username and open the extension popup
4. Click "🔥 Roast Me" in the popup

## Features

- **Auto-detect GitHub usernames** from current tab
- **Roast intensity selector** (mild, medium, spicy)
- **README analysis** toggle
- **Text-to-Speech** playback of roasts
- **Results display** showing:
  - Comedic roast
  - Serious improvement advice
  - Developer personality profile
  - GitHub signals used for analysis

## Technical Details

### Manifest V3

This extension uses Chrome's Manifest V3 with:

- Service worker background script (no persistent background page)
- Message passing between popup, content script, and background
- `chrome.storage.local` for preferences
- Host permissions for GitHub and backend API

### Message Types

**ROAST_REQUEST**

```javascript
{
  type: 'ROAST_REQUEST',
  payload: {
    username: string,
    intensity: 'mild' | 'medium' | 'spicy',
    includeReadme: boolean,
    maxRepos: number
  }
}
```

**TTS_REQUEST**

```javascript
{
  type: 'TTS_REQUEST',
  payload: {
    text: string,
    voiceId: string,
    modelId: string
  }
}
```

### Storage Keys

- `lastUsername`: Last GitHub username entered
- `lastIntensity`: Last roast intensity selected
- `backendUrl`: Backend API base URL
- `voiceId`: ElevenLabs voice ID for TTS

## Backend Requirements

The extension requires a backend API with the following endpoints:

- `POST /roast` - Generate roast from GitHub username
- `POST /tts` - Convert text to speech (returns audio/mpeg)

See the main README for backend specifications.

## Icons

Place icon files in `assets/` directory:

- `icon16.png` (16x16)
- `icon32.png` (32x32)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

For development, you can use placeholder icons or generate them using any image editor.

## Troubleshooting

### Extension not loading

- Check that all file paths in `manifest.json` are correct
- Ensure no syntax errors in JavaScript files
- Check Chrome extension console for errors

### API calls failing

- Verify backend is running on correct port
- Check CORS is enabled on backend
- Verify `host_permissions` in manifest includes backend URL

### Content script not injecting

- Check that you're on a valid GitHub profile page
- Refresh the page after loading extension
- Check browser console for errors

## Development Tips

- Use `chrome://extensions/` to reload the extension after changes
- Check service worker logs in extension details page
- Use popup's browser console for debugging popup.js
- Check page console for content script logs

## License

See main project LICENSE file.
