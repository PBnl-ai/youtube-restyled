/**
 * YouTube Restyled - PB Edition
 * Content Script - DOM Manipulation & New Video Tracking
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    // How long before a video is considered "old" (in hours)
    newVideoThreshold: 24,
    // Check for new elements every X ms
    observerDebounce: 500,
    // Storage keys
    storageKeys: {
      lastVisited: 'ytr_last_visited',
      viewedVideos: 'ytr_viewed_videos'
    }
  };

  // ============================================
  // BACKGROUND LAYERS (Tech Grid, Vignette, Scanline)
  // ============================================
  function injectBackgroundLayers() {
    // Only inject once
    if (document.querySelector('.ytr-tech-grid')) return;

    const layers = [
      { class: 'ytr-tech-grid', zIndex: 0 },
      { class: 'ytr-vignette', zIndex: 1 },
      { class: 'ytr-scanline', zIndex: 2 }
    ];

    layers.forEach(layer => {
      const div = document.createElement('div');
      div.className = layer.class;
      document.body.insertBefore(div, document.body.firstChild);
    });

    console.log('[YTR] Background layers injected');
  }

  // ============================================
  // CORNER BRACKETS
  // ============================================
  function addCornerBrackets(element) {
    // Skip if already has corners
    if (element.querySelector('.ytr-corner')) return;

    // Make sure element has position relative for absolute corners
    element.style.position = 'relative';

    const corners = ['tl', 'tr', 'bl', 'br'];
    corners.forEach(pos => {
      const corner = document.createElement('div');
      corner.className = `ytr-corner ytr-corner-${pos}`;
      element.appendChild(corner);
    });
  }

  // ============================================
  // CHANNEL LABELS ON THUMBNAILS (pb.nl style)
  // ============================================
  function addChannelLabels() {
    const videoItems = document.querySelectorAll('ytd-rich-item-renderer:not(.ytr-label-processed)');

    videoItems.forEach(item => {
      item.classList.add('ytr-label-processed');

      // Get channel name - find link to channel page
      const channelEl = item.querySelector('a[href*="/@"], a[href*="/channel/"]');
      if (!channelEl) return;

      const channelName = channelEl.textContent.trim().toUpperCase();
      if (!channelName) return;

      // Find thumbnail container
      const thumbnail = item.querySelector('ytd-thumbnail, yt-thumbnail-view-model');
      if (!thumbnail || thumbnail.querySelector('.ytr-channel-label')) return;

      thumbnail.style.position = 'relative';

      // Create label
      const label = document.createElement('div');
      label.className = 'ytr-channel-label';
      label.textContent = channelName;
      thumbnail.appendChild(label);
    });
  }

  function processAllThumbnails() {
    // Target multiple possible thumbnail containers (YouTube keeps changing)
    const selectors = [
      'ytd-thumbnail:not(.ytr-processed)',
      'yt-thumbnail-view-model:not(.ytr-processed)',
      'ytd-rich-item-renderer a#thumbnail:not(.ytr-processed)'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        addCornerBrackets(el);
        el.classList.add('ytr-processed');
      });
    });
  }

  // ============================================
  // NEW VIDEO TRACKING
  // ============================================

  // Get stored data from localStorage
  function getStoredData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[YTR] Error reading storage:', e);
      return null;
    }
  }

  // Save data to localStorage
  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('[YTR] Error saving storage:', e);
    }
  }

  // Parse YouTube's relative time strings
  function parseRelativeTime(timeString) {
    if (!timeString) return null;

    const str = timeString.toLowerCase().trim();
    const now = Date.now();

    // Match patterns like "2 hours ago", "3 days ago", etc.
    const patterns = [
      { regex: /(\d+)\s*(?:second|sec)/i, multiplier: 1000 },
      { regex: /(\d+)\s*(?:minute|min)/i, multiplier: 60 * 1000 },
      { regex: /(\d+)\s*(?:hour|hr|uur)/i, multiplier: 60 * 60 * 1000 },
      { regex: /(\d+)\s*(?:day|dag)/i, multiplier: 24 * 60 * 60 * 1000 },
      { regex: /(\d+)\s*(?:week|wk|weken)/i, multiplier: 7 * 24 * 60 * 60 * 1000 },
      { regex: /(\d+)\s*(?:month|maand)/i, multiplier: 30 * 24 * 60 * 60 * 1000 },
      { regex: /(\d+)\s*(?:year|jaar)/i, multiplier: 365 * 24 * 60 * 60 * 1000 }
    ];

    for (const pattern of patterns) {
      const match = str.match(pattern.regex);
      if (match) {
        const value = parseInt(match[1], 10);
        return now - (value * pattern.multiplier);
      }
    }

    // Handle "streamed X ago" format
    if (str.includes('stream') || str.includes('live')) {
      return parseRelativeTime(str.replace(/streamed|live/gi, '').trim());
    }

    return null;
  }

  // Check if a video is "new" (uploaded within threshold)
  function isNewVideo(timeString) {
    const uploadTime = parseRelativeTime(timeString);
    if (!uploadTime) return false;

    const hoursAgo = (Date.now() - uploadTime) / (1000 * 60 * 60);
    return hoursAgo <= CONFIG.newVideoThreshold;
  }

  // Get the channel ID/name from a video element
  function getChannelFromVideo(videoElement) {
    const channelLink = videoElement.querySelector('#channel-name a, ytd-channel-name a');
    if (channelLink) {
      return channelLink.href || channelLink.textContent.trim();
    }
    return null;
  }

  // Get video ID from a video element
  function getVideoId(videoElement) {
    const link = videoElement.querySelector('a#thumbnail, a#video-title-link');
    if (link && link.href) {
      const match = link.href.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  // Add NEW badge to a video
  function addNewBadge(thumbnail) {
    if (thumbnail.querySelector('.ytr-new-badge')) return;

    const badge = document.createElement('div');
    badge.className = 'ytr-new-badge';
    badge.textContent = 'NEW';
    thumbnail.appendChild(badge);
  }

  // Process videos for new content badges
  function processVideosForNewBadges() {
    const lastVisited = getStoredData(CONFIG.storageKeys.lastVisited) || {};
    const viewedVideos = getStoredData(CONFIG.storageKeys.viewedVideos) || {};

    // Process each video on the page
    const videos = document.querySelectorAll('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer');

    videos.forEach(video => {
      if (video.classList.contains('ytr-new-processed')) return;
      video.classList.add('ytr-new-processed');

      // Get metadata
      const metadataLine = video.querySelector('#metadata-line');
      if (!metadataLine) return;

      const timeSpan = metadataLine.querySelector('span:last-child');
      if (!timeSpan) return;

      const timeText = timeSpan.textContent;
      const videoId = getVideoId(video);
      const channel = getChannelFromVideo(video);

      // Check if video is new and not yet viewed
      if (isNewVideo(timeText) && videoId && !viewedVideos[videoId]) {
        const thumbnail = video.querySelector('ytd-thumbnail');
        if (thumbnail) {
          addNewBadge(thumbnail);
          video.classList.add('ytr-has-new');
        }
      }
    });
  }

  // Track when user clicks on a video
  function trackVideoClicks() {
    document.addEventListener('click', (e) => {
      const videoLink = e.target.closest('a#thumbnail, a#video-title-link, ytd-thumbnail');
      if (videoLink) {
        const videoContainer = videoLink.closest('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-compact-video-renderer');
        if (videoContainer) {
          const videoId = getVideoId(videoContainer);
          if (videoId) {
            const viewedVideos = getStoredData(CONFIG.storageKeys.viewedVideos) || {};
            viewedVideos[videoId] = Date.now();
            saveData(CONFIG.storageKeys.viewedVideos, viewedVideos);
          }
        }
      }
    });
  }

  // Track last visit to update "new" status
  function updateLastVisit() {
    const currentPage = window.location.pathname;
    const lastVisited = getStoredData(CONFIG.storageKeys.lastVisited) || {};
    lastVisited[currentPage] = Date.now();
    saveData(CONFIG.storageKeys.lastVisited, lastVisited);
  }

  // Cleanup old entries (keep only last 30 days)
  function cleanupOldData() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // Cleanup viewed videos
    const viewedVideos = getStoredData(CONFIG.storageKeys.viewedVideos) || {};
    const cleanedVideos = {};
    for (const [id, timestamp] of Object.entries(viewedVideos)) {
      if (timestamp > thirtyDaysAgo) {
        cleanedVideos[id] = timestamp;
      }
    }
    saveData(CONFIG.storageKeys.viewedVideos, cleanedVideos);
  }

  // ============================================
  // CHANNEL PAGE ENHANCEMENTS
  // ============================================
  function enhanceChannelPage() {
    // Check if we're on a channel page
    if (!window.location.pathname.includes('/@') && !window.location.pathname.includes('/channel/')) {
      return;
    }

    // Add section headers (if not already present)
    const sections = document.querySelectorAll('ytd-shelf-renderer:not(.ytr-enhanced)');
    sections.forEach(section => {
      section.classList.add('ytr-enhanced');
      // Could add custom section numbering like "01. RECENT UPLOADS" here
    });
  }

  // ============================================
  // MONOSPACE STYLING FOR METADATA
  // ============================================
  function applyMonospaceToMetadata() {
    const metadataElements = document.querySelectorAll('#metadata-line:not(.ytr-mono-applied)');
    metadataElements.forEach(el => {
      el.classList.add('ytr-mono-applied', 'ytr-mono');
    });
  }

  // ============================================
  // SEARCH BAR ENHANCEMENT
  // ============================================
  function enhanceSearchBar() {
    const searchInput = document.querySelector('#search-input');
    if (searchInput && !searchInput.dataset.ytrEnhanced) {
      searchInput.dataset.ytrEnhanced = 'true';
      searchInput.placeholder = 'SEARCH_DATABASE...';
    }

  }

  // ============================================
  // FILTER CHIPS (ALL, MUSIC, PODCASTS, etc.) - Match channel label size
  // Works on homepage AND search results page
  // ============================================
  function styleFilterChips() {
    const chips = document.querySelectorAll('yt-chip-cloud-chip-renderer:not(.ytr-chip-styled), ytd-search-filter-group-renderer yt-chip-cloud-chip-renderer:not(.ytr-chip-styled)');
    chips.forEach(chip => {
      chip.classList.add('ytr-chip-styled');

      // Style chip container
      chip.style.setProperty('background', 'rgba(0, 0, 0, 0.75)', 'important');
      chip.style.setProperty('display', 'inline-block', 'important');
      chip.style.setProperty('height', 'auto', 'important');
      chip.style.setProperty('padding', '0', 'important');
      chip.style.setProperty('margin-right', '6px', 'important');
      chip.style.setProperty('border-radius', '0', 'important');

      // Target the ytChipShapeChip - this is where the text actually is
      const chipShape = chip.querySelector('.ytChipShapeChip');
      if (chipShape) {
        chipShape.style.setProperty('height', 'auto', 'important');
        chipShape.style.setProperty('min-height', '0', 'important');
        chipShape.style.setProperty('padding', '3px 6px', 'important');
        chipShape.style.setProperty('font-family', "'JetBrains Mono', monospace", 'important');
        chipShape.style.setProperty('font-size', '9px', 'important');
        chipShape.style.setProperty('line-height', '1', 'important');
        chipShape.style.setProperty('display', 'inline-block', 'important');
        chipShape.style.setProperty('text-transform', 'uppercase', 'important');
        chipShape.style.setProperty('letter-spacing', '0.05em', 'important');
        chipShape.style.setProperty('color', 'rgba(255, 255, 255, 0.8)', 'important');
        chipShape.style.setProperty('border-radius', '0', 'important');
      }

      // Hide touch feedback overlay
      const touchFeedback = chip.querySelector('yt-touch-feedback-shape');
      if (touchFeedback) {
        touchFeedback.style.setProperty('display', 'none', 'important');
      }

      // Reset all other inner elements
      chip.querySelectorAll('div, button, chip-shape').forEach(el => {
        el.style.setProperty('height', 'auto', 'important');
        el.style.setProperty('min-height', '0', 'important');
        el.style.setProperty('border-radius', '0', 'important');
      });
    });
  }

  // ============================================
  // SIDEBAR SECTION HEADERS (Subscriptions, You, Explore, etc.)
  // ============================================
  function styleSidebarHeaders() {
    // Style SUBSCRIPTIONS and YOU (collapsible sections)
    const collapsibleTitles = document.querySelectorAll('ytd-guide-collapsible-section-entry-renderer #header-entry yt-formatted-string.title:not(.ytr-header-styled)');
    collapsibleTitles.forEach(title => {
      title.classList.add('ytr-header-styled');
      title.style.cssText = `
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 9px !important;
        font-weight: 500 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        color: rgba(255, 255, 255, 0.8) !important;
        background: #222 !important;
        padding: 3px 6px !important;
        display: inline-block !important;
        height: auto !important;
        min-height: 0 !important;
        line-height: 1.2 !important;
      `;
    });

    // Style EXPLORE, MORE FROM YOUTUBE (regular sections)
    const sectionTitles = document.querySelectorAll('ytd-guide-section-renderer h3 yt-formatted-string#guide-section-title:not(.ytr-header-styled)');
    sectionTitles.forEach(title => {
      title.classList.add('ytr-header-styled');
      title.style.cssText = `
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 9px !important;
        font-weight: 500 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        color: rgba(255, 255, 255, 0.8) !important;
        background: #222 !important;
        padding: 3px 6px !important;
        display: inline-block !important;
        height: auto !important;
        min-height: 0 !important;
        line-height: 1.2 !important;
      `;
    });
  }

  // ============================================
  // REBRAND LOGO: Add "PB.NL" before the red YouTube icon
  // ============================================
  function rebrandLogo() {
    // Check if already rebranded
    if (document.querySelector('.ytr-pb-text')) return;

    // Load Bebas Neue font if not already loaded
    if (!document.querySelector('#ytr-bebas-font')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'ytr-bebas-font';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }

    // Find the ytd-logo element which contains the SVG
    const ytdLogo = document.querySelector('ytd-topbar-logo-renderer ytd-logo');
    if (!ytdLogo) return;

    // Make the logo container a flex container
    ytdLogo.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
    `;

    // Create "PB.NL" link element to go BEFORE the YouTube icon
    // Using Bebas Neue font like on pb.nl website
    const pbText = document.createElement('a');
    pbText.className = 'ytr-pb-text';
    pbText.href = 'https://www.pb.nl';
    pbText.target = '_blank';
    pbText.textContent = 'PB.NL';
    pbText.style.cssText = `
      font-family: 'Bebas Neue', sans-serif;
      font-size: 20px;
      font-weight: 400;
      color: white;
      margin-right: 6px;
      letter-spacing: 0.05em;
      position: relative;
      top: 1px;
      text-decoration: none;
      cursor: pointer;
    `;

    // Prevent YouTube's parent click handler from intercepting
    pbText.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open('https://www.pb.nl', '_blank');
    });

    // Insert PB.NL as the first child of ytd-logo (before the SVG)
    ytdLogo.insertBefore(pbText, ytdLogo.firstChild);

    console.log('[YTR] Logo rebranded: PB.NL [YouTube icon] - linked to pb.nl');
  }

  // ============================================
  // MUTATION OBSERVER - Watch for new content
  // ============================================
  let debounceTimer = null;

  function handleMutations() {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      processAllThumbnails();
      processVideosForNewBadges();
      applyMonospaceToMetadata();
      enhanceChannelPage();
      enhanceSearchBar();
      rebrandLogo();
      addChannelLabels();
      styleSidebarHeaders();
      styleFilterChips();
    }, CONFIG.observerDebounce);
  }

  function startObserver() {
    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[YTR] Mutation observer started');
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    console.log('[YTR] YouTube Restyled - PB Edition initializing...');

    // Inject background effects
    injectBackgroundLayers();

    // Initial processing
    processAllThumbnails();
    processVideosForNewBadges();
    applyMonospaceToMetadata();
    enhanceSearchBar();
    rebrandLogo();
    addChannelLabels();
    styleSidebarHeaders();
    styleFilterChips();

    // Start observing for dynamic content
    startObserver();

    // Track video clicks
    trackVideoClicks();

    // Update last visit timestamp
    updateLastVisit();

    // Retry search/create corners after delay (masthead loads late)
    setTimeout(() => {
      console.log('[YTR] Delayed corner check...');
      enhanceSearchBar();
    }, 2000);

    setTimeout(() => {
      enhanceSearchBar();
    }, 4000);

    // Cleanup old data periodically
    cleanupOldData();

    console.log('[YTR] Initialization complete!');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also run on YouTube's SPA navigation
  window.addEventListener('yt-navigate-finish', () => {
    console.log('[YTR] Navigation detected, re-processing...');
    handleMutations();
    updateLastVisit();
  });

})();
