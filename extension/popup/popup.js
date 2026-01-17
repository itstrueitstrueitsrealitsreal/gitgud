// Popup script for GitGud Chrome Extension
// Handles user interactions and communicates with background service worker

document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const usernameInput = document.getElementById("username");
  const intensitySelect = document.getElementById("intensity");
  const includeReadmeCheckbox = document.getElementById("includeReadme");
  const roastBtn = document.getElementById("roastBtn");
  const speakBtn = document.getElementById("speakBtn");
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const results = document.getElementById("results");

  // Result elements
  const roastText = document.getElementById("roastText");
  const adviceList = document.getElementById("adviceList");
  const archetype = document.getElementById("archetype");
  const strengthsList = document.getElementById("strengthsList");
  const blindSpotsList = document.getElementById("blindSpotsList");
  const signalsContent = document.getElementById("signalsContent");

  let currentRoastText = "";
  let audioElement = null;
  let isPlaying = false;

  // Load saved preferences
  chrome.storage.local.get(
    ["lastUsername", "lastIntensity", "backendUrl"],
    (data) => {
      if (data.lastUsername) {
        usernameInput.value = data.lastUsername;
      }
      if (data.lastIntensity) {
        intensitySelect.value = data.lastIntensity;
      }
    },
  );

  // Auto-fill username from current tab if on GitHub
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab.url && tab.url.includes("github.com/")) {
      const match = tab.url.match(/github\.com\/([^\/]+)/);
      if (
        match &&
        match[1] &&
        !["orgs", "topics", "collections", "trending", "explore"].includes(
          match[1],
        )
      ) {
        usernameInput.value = match[1];
      }
    }
  } catch (err) {
    console.error("Error auto-filling username:", err);
  }

  // Roast button handler
  roastBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const intensity = intensitySelect.value;
    const includeReadme = includeReadmeCheckbox.checked;

    if (!username) {
      showError("Please enter a GitHub username");
      return;
    }

    // Save preferences
    chrome.storage.local.set({
      lastUsername: username,
      lastIntensity: intensity,
    });

    // Show loading state
    hideError();
    hideResults();
    showLoading();
    roastBtn.disabled = true;

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: "ROAST_REQUEST",
        payload: {
          username,
          intensity,
          includeReadme,
          maxRepos: 5,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate roast");
      }

      // Display results
      displayResults(response);
      currentRoastText = response.result.roast;
      speakBtn.disabled = false;
    } catch (err) {
      showError(err.message || "An error occurred. Please try again.");
    } finally {
      hideLoading();
      roastBtn.disabled = false;
    }
  });

  // Speak button handler
  speakBtn.addEventListener("click", async () => {
    if (isPlaying) {
      // Stop current playback
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        isPlaying = false;
        speakBtn.textContent = "🔊 Speak Roast";
      }
      return;
    }

    if (!currentRoastText) {
      showError("No roast to speak. Please generate a roast first.");
      return;
    }

    speakBtn.disabled = true;
    speakBtn.textContent = "⏳ Generating audio...";

    try {
      // Get voice ID from storage or use default
      const { voiceId } = await chrome.storage.local.get(["voiceId"]);

      const response = await chrome.runtime.sendMessage({
        type: "TTS_REQUEST",
        payload: {
          text: currentRoastText,
          voiceId: voiceId || "EXAVITQu4vr4xnSDxMaL", // Default ElevenLabs voice
          modelId: "eleven_multilingual_v2",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate audio");
      }

      // Create audio element and play
      if (audioElement) {
        audioElement.pause();
        audioElement = null;
      }

      // Convert base64 to blob and create object URL
      const audioBlob = base64ToBlob(response.audioData, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob);

      audioElement = new Audio(audioUrl);
      audioElement.addEventListener("ended", () => {
        isPlaying = false;
        speakBtn.textContent = "🔊 Speak Roast";
        speakBtn.disabled = false;
        URL.revokeObjectURL(audioUrl);
      });

      audioElement.addEventListener("error", (e) => {
        showError("Failed to play audio");
        isPlaying = false;
        speakBtn.textContent = "🔊 Speak Roast";
        speakBtn.disabled = false;
        URL.revokeObjectURL(audioUrl);
      });

      audioElement.play();
      isPlaying = true;
      speakBtn.textContent = "⏸️ Stop";
      speakBtn.disabled = false;
    } catch (err) {
      showError(err.message || "Failed to generate audio");
      speakBtn.textContent = "🔊 Speak Roast";
      speakBtn.disabled = false;
    }
  });

  // Helper functions
  function showLoading() {
    loading.classList.remove("hidden");
  }

  function hideLoading() {
    loading.classList.add("hidden");
  }

  function showError(message) {
    error.querySelector(".error-message").textContent = message;
    error.classList.remove("hidden");
  }

  function hideError() {
    error.classList.add("hidden");
  }

  function hideResults() {
    results.classList.add("hidden");
  }

  function displayResults(data) {
    // Display roast
    roastText.textContent = data.result.roast;

    // Display advice
    adviceList.innerHTML = "";
    data.result.advice.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      adviceList.appendChild(li);
    });

    // Display profile
    archetype.textContent = data.result.profile.archetype;

    strengthsList.innerHTML = "";
    data.result.profile.strengths.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      strengthsList.appendChild(li);
    });

    blindSpotsList.innerHTML = "";
    data.result.profile.blind_spots.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      blindSpotsList.appendChild(li);
    });

    // Display signals
    const signals = data.signals;
    let signalsHTML = `
      <p><strong>Username:</strong> ${data.username}</p>
      <p><strong>Public Repos:</strong> ${signals.profile.public_repos || 0}</p>
      <p><strong>Followers:</strong> ${signals.profile.followers || 0}</p>
      <p><strong>Account Created:</strong> ${new Date(signals.profile.created_at).toLocaleDateString()}</p>
    `;

    if (signals.top_repos && signals.top_repos.length > 0) {
      signalsHTML += `<p><strong>Top Repos Analyzed:</strong> ${signals.top_repos.length}</p>`;
    }

    signalsContent.innerHTML = signalsHTML;

    // Show results
    hideError();
    results.classList.remove("hidden");
    results.scrollIntoView({ behavior: "smooth" });
  }

  function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }
});
