// Background service worker for GitGud Chrome Extension
// Handles API calls to backend and message passing

// Default backend URL - can be changed via storage
const DEFAULT_BACKEND_URL = "http://localhost:3000";

// Message listener for popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Return true to indicate async response
  if (request.type === "ROAST_REQUEST") {
    handleRoastRequest(request.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: { message: error.message } }));
    return true;
  }

  if (request.type === "TTS_REQUEST") {
    handleTTSRequest(request.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: { message: error.message } }));
    return true;
  }

  if (request.type === "GET_BACKEND_URL") {
    getBackendUrl()
      .then((url) => sendResponse({ backendUrl: url }))
      .catch((error) => sendResponse({ error: { message: error.message } }));
    return true;
  }

  return false;
});

// Handle roast generation request
async function handleRoastRequest(payload) {
  try {
    const backendUrl = await getBackendUrl();
    const url = `${backendUrl}/roast`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP error ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Roast request failed:", error);
    throw error;
  }
}

// Handle TTS request
async function handleTTSRequest(payload) {
  try {
    const backendUrl = await getBackendUrl();
    const url = `${backendUrl}/tts`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP error ${response.status}`,
      );
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64 for sending to popup
    const base64Audio = arrayBufferToBase64(audioBuffer);

    return {
      audioData: base64Audio,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    console.error("TTS request failed:", error);
    throw error;
  }
}

// Get backend URL from storage or use default
async function getBackendUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["backendUrl"], (result) => {
      resolve(result.backendUrl || DEFAULT_BACKEND_URL);
    });
  });
}

// Helper: Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("GitGud extension installed!");

    // Set default backend URL if not already set
    chrome.storage.local.get(["backendUrl"], (result) => {
      if (!result.backendUrl) {
        chrome.storage.local.set({ backendUrl: DEFAULT_BACKEND_URL });
      }
    });
  }

  // Context menu feature disabled due to service worker compatibility issues
  // Users can still use the popup or the "Roast This Dev" button on GitHub pages
});

// Keep service worker alive by periodically receiving messages
// This helps prevent the service worker from being terminated
let keepAliveInterval;

function keepAlive() {
  keepAliveInterval = setInterval(() => {
    // Just a ping to keep the service worker active
    chrome.runtime.getPlatformInfo(() => {});
  }, 20000); // Every 20 seconds
}

// Start keep-alive on service worker activation
keepAlive();

// Clean up on service worker termination
self.addEventListener("deactivate", () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});
