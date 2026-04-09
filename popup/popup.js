/**
 * YouTube Restyled - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const thresholdSlider = document.getElementById('threshold');
  const thresholdValue = document.getElementById('thresholdValue');
  const resetBtn = document.getElementById('resetBtn');

  // Feature toggles
  const toggles = {
    techGrid: document.getElementById('techGrid'),
    scanline: document.getElementById('scanline'),
    vignette: document.getElementById('vignette'),
    cornerBrackets: document.getElementById('cornerBrackets'),
    grayscale: document.getElementById('grayscale'),
    newBadges: document.getElementById('newBadges'),
    hideShorts: document.getElementById('hideShorts'),
    compactLayout: document.getElementById('compactLayout')
  };

  // Default settings
  const defaultSettings = {
    enabled: true,
    features: {
      techGrid: true,
      scanline: true,
      vignette: true,
      cornerBrackets: true,
      grayscale: true,
      newBadges: true,
      hideShorts: true,
      compactLayout: true
    },
    newVideoThreshold: 24
  };

  // Load current settings
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (settings) => {
        if (Object.keys(settings).length === 0) {
          // No settings saved, use defaults
          chrome.storage.sync.set(defaultSettings, () => {
            resolve(defaultSettings);
          });
        } else {
          resolve(settings);
        }
      });
    });
  }

  // Save settings
  function saveSettings(settings) {
    chrome.storage.sync.set(settings);
    notifyContentScript(settings);
  }

  // Notify content script of setting changes
  function notifyContentScript(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'settingsUpdated',
          settings: settings
        }).catch(() => {
          // Tab might not have content script, ignore error
        });
      }
    });
  }

  // Update UI with settings
  function updateUI(settings) {
    // Status
    const isEnabled = settings.enabled !== false;
    statusDot.classList.toggle('disabled', !isEnabled);
    statusText.textContent = isEnabled ? 'ACTIVE' : 'DISABLED';

    // Feature toggles
    const features = settings.features || defaultSettings.features;
    toggles.techGrid.checked = features.techGrid !== false;
    toggles.scanline.checked = features.scanline !== false;
    toggles.vignette.checked = features.vignette !== false;
    toggles.cornerBrackets.checked = features.cornerBrackets !== false;
    toggles.grayscale.checked = features.grayscale !== false;
    toggles.newBadges.checked = features.newBadges !== false;
    toggles.hideShorts.checked = features.hideShorts !== false;
    toggles.compactLayout.checked = features.compactLayout !== false;

    // Threshold slider
    const threshold = settings.newVideoThreshold || 24;
    thresholdSlider.value = threshold;
    thresholdValue.textContent = threshold + 'H';
  }

  // Handle toggle changes
  function handleToggleChange(key) {
    return async (e) => {
      const settings = await loadSettings();
      if (!settings.features) settings.features = {};
      settings.features[key] = e.target.checked;
      saveSettings(settings);
    };
  }

  // Initialize
  const settings = await loadSettings();
  updateUI(settings);

  // Attach event listeners to toggles
  Object.entries(toggles).forEach(([key, element]) => {
    element.addEventListener('change', handleToggleChange(key));
  });

  // Threshold slider
  thresholdSlider.addEventListener('input', (e) => {
    thresholdValue.textContent = e.target.value + 'H';
  });

  thresholdSlider.addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.newVideoThreshold = parseInt(e.target.value, 10);
    saveSettings(settings);
  });

  // Reset button
  resetBtn.addEventListener('click', async () => {
    if (confirm('Reset all settings to default?')) {
      await chrome.storage.sync.clear();
      chrome.storage.sync.set(defaultSettings, () => {
        updateUI(defaultSettings);
        notifyContentScript(defaultSettings);
      });

      // Also clear localStorage in content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'resetStorage' }).catch(() => {});
        }
      });
    }
  });

  // Click on status to toggle extension
  document.querySelector('.status-bar').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.enabled = !settings.enabled;
    saveSettings(settings);
    updateUI(settings);
  });
});
