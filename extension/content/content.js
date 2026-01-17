// Content script for GitGud Chrome Extension
// Runs on github.com pages to detect profiles and inject "Roast" button

(function () {
  "use strict";

  // Check if we're on a GitHub profile page
  function isProfilePage() {
    const pathParts = window.location.pathname.split("/").filter((p) => p);

    // Profile pages are typically github.com/username
    // Exclude org pages, topics, collections, etc.
    if (pathParts.length === 1) {
      const username = pathParts[0];
      const excludedPaths = [
        "orgs",
        "topics",
        "collections",
        "trending",
        "explore",
        "marketplace",
        "pricing",
        "features",
      ];
      return !excludedPaths.includes(username);
    }

    return false;
  }

  // Extract username from URL
  function extractUsername() {
    const pathParts = window.location.pathname.split("/").filter((p) => p);
    return pathParts[0] || null;
  }

  // Create and inject the roast button
  function injectRoastButton() {
    // Check if button already exists
    if (document.getElementById("gitgud-roast-btn")) {
      return;
    }

    // Find the profile header area
    const profileHeader =
      document.querySelector(".user-profile-nav") ||
      document.querySelector(
        '[data-tab-container-id="user-profile-tab-container"]',
      ) ||
      document.querySelector(".UnderlineNav");

    if (!profileHeader) {
      console.log("GitGud: Profile header not found, retrying...");
      return;
    }

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "gitgud-roast-btn";
    buttonContainer.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      vertical-align: middle;
    `;

    // Create the button
    const button = document.createElement("button");
    button.textContent = "🔥 Roast This Dev";
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    `;

    // Hover effect
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px)";
      button.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.5)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.3)";
    });

    // Click handler
    button.addEventListener("click", async () => {
      const username = extractUsername();
      if (!username) {
        alert("Could not extract username from page");
        return;
      }

      // Save username to storage for popup to use
      chrome.storage.local.set({ lastUsername: username });

      // Open popup (note: this only works if user has interacted with extension before)
      // Otherwise, we show a message
      try {
        // Try to send message to background script
        chrome.runtime.sendMessage({ type: "OPEN_POPUP" });

        // Also show a notification
        showNotification(
          `Ready to roast @${username}! Click the GitGud extension icon.`,
        );
      } catch (err) {
        showNotification(
          `Click the GitGud extension icon to roast @${username}!`,
        );
      }
    });

    buttonContainer.appendChild(button);

    // Insert button into the page
    const insertionPoint =
      profileHeader.querySelector(".UnderlineNav-actions") ||
      profileHeader.querySelector("nav") ||
      profileHeader;

    if (insertionPoint) {
      insertionPoint.style.display = "flex";
      insertionPoint.style.alignItems = "center";
      insertionPoint.appendChild(buttonContainer);
      console.log("GitGud: Roast button injected successfully");
    }
  }

  // Show a temporary notification
  function showNotification(message) {
    // Remove existing notification if any
    const existing = document.getElementById("gitgud-notification");
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement("div");
    notification.id = "gitgud-notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize on profile pages
  function init() {
    if (isProfilePage()) {
      // Wait for page to be fully loaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          setTimeout(injectRoastButton, 1000);
        });
      } else {
        setTimeout(injectRoastButton, 1000);
      }

      // Also observe for dynamic content changes (GitHub is SPA)
      const observer = new MutationObserver(() => {
        if (isProfilePage() && !document.getElementById("gitgud-roast-btn")) {
          injectRoastButton();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Handle GitHub's SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      init();
    }
  }).observe(document, { subtree: true, childList: true });

  // Initial injection
  init();

  console.log("GitGud content script loaded");
})();
