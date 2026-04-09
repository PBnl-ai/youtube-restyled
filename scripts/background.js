/**
 * YouTube Restyled - PB Edition
 * Background Service Worker
 */

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[YTR] Extension installed!');

    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      features: {
        techGrid: true,
        scanline: true,
        vignette: true,
        cornerBrackets: true,
        grayscaleThumbnails: true,
        newBadges: true,
        hideShorts: true,
        compactLayout: true
      },
      newVideoThreshold: 24 // hours
    });
  }

  if (details.reason === 'update') {
    console.log('[YTR] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse(settings);
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'updateSetting') {
    chrome.storage.sync.set({ [message.key]: message.value }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle extension icon click (open popup)
chrome.action.onClicked.addListener((tab) => {
  // Popup will open automatically, but we could add custom behavior here
});

console.log('[YTR] Background service worker initialized');
