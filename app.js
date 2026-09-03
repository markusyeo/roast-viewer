// Roast journal UI

let roastsData = [];
let selectedRoast = null;
let currentProcess = "all";
let searchQuery = "";

// Compare mode state
let isCompareMode = false;
let activeCompareSlot = "A"; // "A" or "B"
let compareRoastA = null;
let compareRoastB = null;
let activeContextMenuRoast = null;
let lastFocusedContextMenuTrigger = null;

// Hover scrubber requestAnimationFrame batching state
let isScrubberFramePending = false;
let pendingScrubState = null;

// ResizeObserver debouncing timer
let resizeDebounceTimer = null;

// Channel visibility
const visibleChannels = {
  bt: true,
  et: true,
  ror: true,
  heat: true,
  fan: true,
};

// DOM elements
const workspaceLayout = document.querySelector(".workspace-layout");
const roastsGrid = document.getElementById("roasts-grid");
const filteredCount = document.getElementById("filtered-count");
const roastCountEl = document.getElementById("roast-count");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const processFilterBtns = document.querySelectorAll("#process-filters .filter-tab");
const themeToggleBtn = document.getElementById("theme-toggle");
const roastContextMenu = document.getElementById("roast-context-menu");

// Sidebar toggle & compare buttons
const mobileSidebarToggle = document.getElementById("mobile-sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const sidebarPeekStrip = document.getElementById("sidebar-peek-strip");
const sidebarCompareToggle = document.getElementById("sidebar-compare-toggle");
const sidebarCompareBtnText = document.getElementById("sidebar-compare-btn-text");
const sidebarCollapseBtn = document.getElementById("sidebar-collapse-btn");
const singleSidebarToggle = document.getElementById("single-sidebar-toggle");
const compareSidebarToggle = document.getElementById("compare-sidebar-toggle");

// Compare slot picker elements
const compareSlotPicker = document.getElementById("compare-slot-picker");
const targetSlotABtn = document.getElementById("target-slot-a");
const targetSlotBBtn = document.getElementById("target-slot-b");
const pickerNameA = document.getElementById("picker-name-a");
const pickerNameB = document.getElementById("picker-name-b");
const pickerSwapBtn = document.getElementById("picker-swap-btn");
const pickerExitBtn = document.getElementById("picker-exit-btn");
const swapCompareBtn = document.getElementById("swap-compare-btn");

// Single detail panel elements
const detailPanel = document.getElementById("detail-panel");
const detailTitle = document.getElementById("detail-title");
const detailRegionVarietal = document.getElementById("detail-region-varietal");
const detailProcess = document.getElementById("detail-process");
const detailOrigin = document.getElementById("detail-origin");
const detailDate = document.getElementById("detail-date");
const downloadAlogBtn = document.getElementById("download-alog-btn");

const metricWeight = document.getElementById("metric-weight") || document.getElementById("detail-weight");
const metricTotalTime = document.getElementById("metric-total-time") || document.getElementById("detail-total-time");
const metricDtr = document.getElementById("metric-dtr") || document.getElementById("detail-dtr");
const metricFc = document.getElementById("metric-fc") || document.getElementById("detail-fc");
const metricDrop = document.getElementById("metric-drop") || document.getElementById("detail-drop");
const metricScore = document.getElementById("metric-score") || document.getElementById("detail-score");

const labelDry = document.getElementById("label-dry");
const labelMid = document.getElementById("label-mid");
const labelFinish = document.getElementById("label-finish");
const barDry = document.getElementById("bar-dry");
const barMid = document.getElementById("bar-mid");
const barFinish = document.getElementById("bar-finish");

const detailFlavourChips = document.getElementById("detail-flavour-chips");
const detailCuppingNotes = document.getElementById("detail-cupping-notes");
const detailGoal = document.getElementById("detail-goal");
const curveCanvas = document.getElementById("curve-canvas");
const chartTooltip = document.getElementById("chart-tooltip");
const channelLegend = document.getElementById("channel-legend");

// Compare panel elements
const comparePanel = document.getElementById("compare-panel");
const exitCompareBtn = document.getElementById("exit-compare-btn");
const compareDeltaChips = document.getElementById("compare-delta-chips");
const compareColumnsContainer = document.getElementById("compare-columns-container");
const compareChannelLegend = document.getElementById("compare-channel-legend");

const colRoastA = document.getElementById("col-roast-a");
const colRoastB = document.getElementById("col-roast-b");
const btnFocusColA = document.getElementById("btn-focus-col-a");
const btnFocusColB = document.getElementById("btn-focus-col-b");

const cmpCanvasA = document.getElementById("cmp-canvas-a");
const cmpTooltipA = document.getElementById("cmp-tooltip-a");
const cmpCanvasB = document.getElementById("cmp-canvas-b");
const cmpTooltipB = document.getElementById("cmp-tooltip-b");

// Compare overlay elements
const compareOverlayStage = document.getElementById("compare-overlay-stage");
const cmpOverlayCanvas = document.getElementById("cmp-overlay-canvas");
const cmpOverlayTooltip = document.getElementById("cmp-overlay-tooltip");
const btnViewOverlay = document.getElementById("btn-view-overlay");
const btnViewSplit = document.getElementById("btn-view-split");
const overlayNameA = document.getElementById("overlay-name-a");
const overlayNameB = document.getElementById("overlay-name-b");

let compareViewMode = "overlay"; // "overlay" | "split"

// Format seconds to m:ss
function formatTime(s) {
  if (s == null || isNaN(s)) return "-";
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Capitalize words
function toTitleCase(str) {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// // Format date and time cleanly
function formatDateTime(dateStr, timeStr) {
  if (!dateStr && !timeStr) return "-";
  if (dateStr && timeStr) {
    return `${dateStr} · ${timeStr}`;
  }
  return dateStr || timeStr || "-";
}

// Escape HTML for safety
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format cupping score badge
// Format cupping score badge with SVG star icon
function formatScoreHtml(score) {
  if (score == null) return "-";
  const str = String(score).trim();
  if (!str) return "-";
  const cleaned = str.replace(/[★*]/g, "").replace(/\s*pts?$/i, "").trim();
  if (!cleaned) return "-";
  return `<span class="score-badge"><svg class="star-icon" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>${escapeHtml(cleaned)} pts</span></span>`;
}

// Map flavor notes to SCA flavor wheel categories
function getFlavorClass(note) {
  if (!note) return "flavor-default";
  const lower = note.toLowerCase().trim();

  if (/\b(winey|boozy|rum|whiskey|ferment|fermented|kombucha|wine|cognac|brandy|liquor|bourbon|cider)\b/i.test(lower)) {
    return "flavor-ferment";
  }
  if (/\b(jasmine|lavender|rose|floral|elderflower|chamomile|blossom|flower|hibiscus|violet|magnolia|pu-erh|tea)\b/i.test(lower)) {
    return "flavor-floral";
  }
  if (/\b(lemon|lime|orange|bergamot|grapefruit|yuzu|citrus|tangerine|zest|mandarin|clementine)\b/i.test(lower)) {
    return "flavor-citrus";
  }
  if (/\b(berry|strawberry|cherry|peach|apricot|grape|plum|apple|tropical|mango|pineapple|jackfruit|passionfruit|raisin|fig|date|melon|blueberry|blackberry|raspberry|currant|pomegranate|cranberry|lychee|guava|banana|pear|papaya)\b/i.test(lower)) {
    return "flavor-berry";
  }
  if (/\b(chocolate|cocoa|mocha|cacao|fudge)\b|choco/i.test(lower)) {
    return "flavor-choco";
  }
  if (/\b(cinnamon|clove|nutmeg|cardamon|cardamom|ginger|pepper|anise|spiced|spicy|allspice)\b/i.test(lower)) {
    return "flavor-spice";
  }
  if (/\b(almond|hazelnut|peanut|cashew|walnut|pecan|nutty|nut|pistachio|macadamia|praline)\b/i.test(lower)) {
    return "flavor-nut";
  }
  if (/\b(caramel|toffee|brown sugar|molasses|honey|vanilla|maple|syrup|sweet|stevia|sugar|butterscotch|nougat)\b/i.test(lower)) {
    return "flavor-sweet";
  }

  return "flavor-default";
}

// Render flavor tags with SCA color coding
function renderFlavorChipsHtml(notesStr, emptyPlaceholder = "No tasting notes recorded") {
  if (!notesStr || !notesStr.trim()) {
    return `<span class="flavour-chip flavor-default">${escapeHtml(emptyPlaceholder)}</span>`;
  }
  const chips = notesStr.split(/[,;]+/).map((n) => n.trim()).filter(Boolean);
  if (chips.length === 0) {
    return `<span class="flavour-chip flavor-default">${escapeHtml(emptyPlaceholder)}</span>`;
  }
  return chips
    .map((c) => `<span class="flavour-chip ${getFlavorClass(c)}">${escapeHtml(c)}</span>`)
    .join("");
}

// Render formatted scrub tooltip content using semantic classes
function renderScrubTooltipHtml(closest, channels = visibleChannels) {
  if (!closest) return "";
  const sec = closest.time_s != null ? closest.time_s.toFixed(0) : "0";
  const btStr = closest.bt != null ? closest.bt.toFixed(1) : "-";
  const etStr = closest.et != null ? closest.et.toFixed(1) : "-";
  const rorStr = closest.ror != null ? closest.ror.toFixed(1) : "-";
  const heatStr = closest.heat != null && closest.heat >= 0 ? `${closest.heat}%` : "-";
  const fanStr = closest.fan != null && closest.fan >= 0 ? `${closest.fan}%` : "-";

  return `
    <div class="scrub-tooltip-time">
      ${formatTime(closest.time_s)} <span class="scrub-tooltip-seconds">(${sec}s)</span>
    </div>
    ${channels.bt ? `<div class="scrub-tooltip-row scrub-bt">BT: ${btStr}°C</div>` : ""}
    ${channels.et ? `<div class="scrub-tooltip-row scrub-et">ET: ${etStr}°C</div>` : ""}
    ${channels.ror ? `<div class="scrub-tooltip-row scrub-ror">RoR: ${rorStr} °C/min</div>` : ""}
    <div class="scrub-tooltip-control">Heat: ${heatStr} • Fan: ${fanStr}</div>
  `;
}

// Debounced chart redraw for resizing and responsive container shifts
function debouncedRedrawCharts() {
  if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    if (isCompareMode) {
      renderCompareView();
    } else if (selectedRoast) {
      drawChart(selectedRoast, curveCanvas, chartTooltip);
    }
  }, 100);
}

// ResizeObserver for canvas stage containers
function setupCanvasResizeObservers() {
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver((entries) => {
      let shouldRedraw = false;
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          shouldRedraw = true;
          break;
        }
      }
      if (shouldRedraw) {
        debouncedRedrawCharts();
      }
    });

    document.querySelectorAll(".canvas-stage-wrapper").forEach((el) => {
      ro.observe(el);
    });
  }
}

// Clear detail panel placeholder values
function clearDetailPanelState(title = "Loading roast…") {
  if (detailTitle) detailTitle.textContent = title;
  if (detailOrigin) detailOrigin.textContent = "-";
  if (detailProcess) detailProcess.textContent = "-";
  if (detailDate) detailDate.textContent = "-";
  if (detailRegionVarietal) detailRegionVarietal.textContent = "-";
  if (downloadAlogBtn) {
    downloadAlogBtn.href = "#";
    downloadAlogBtn.removeAttribute("download");
  }

  if (metricWeight) metricWeight.textContent = "-";
  if (metricTotalTime) metricTotalTime.textContent = "-";
  if (metricDtr) metricDtr.textContent = "-";
  if (metricFc) metricFc.textContent = "-";
  if (metricDrop) metricDrop.textContent = "-";
  if (metricScore) metricScore.textContent = "-";

  if (barDry) barDry.style.width = "0%";
  if (barMid) barMid.style.width = "0%";
  if (barFinish) barFinish.style.width = "0%";
  if (labelDry) labelDry.textContent = "Drying: -";
  if (labelMid) labelMid.textContent = "Maillard: -";
  if (labelFinish) labelFinish.textContent = "Development: -";

  if (detailFlavourChips) detailFlavourChips.innerHTML = "";
  if (detailCuppingNotes) detailCuppingNotes.textContent = "No cupping notes recorded.";
  if (detailGoal) detailGoal.textContent = "Standard profile";

  if (curveCanvas) {
    const ctx = curveCanvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      const w = curveCanvas.clientWidth || 300;
      const h = curveCanvas.clientHeight || 200;
      curveCanvas.width = Math.floor(w * dpr);
      curveCanvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getThemeColor("--text-dim", "#78716c");
      ctx.font = `13px var(--font-sans)`;
      ctx.textAlign = "center";
      ctx.fillText("No curve data available", w / 2, h / 2);
    }
  }
}

// Display structured error banner when fetching roasts fails
function showNetworkErrorState(errorMessage) {
  selectedRoast = null;
  compareRoastA = null;
  compareRoastB = null;
  if (roastCountEl) roastCountEl.textContent = "0";
  if (filteredCount) filteredCount.textContent = "0";

  roastsGrid.innerHTML = `
    <div class="network-error-state" role="alert">
      <div class="error-icon-box" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="error-content">
        <h3 class="error-title">Failed to load roast logs</h3>
        <p class="error-message">${escapeHtml(errorMessage || "Could not fetch data/roasts.json. Check network connection or server status.")}</p>
        <button id="retry-fetch-btn" class="btn-retry" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Retry connection
        </button>
      </div>
    </div>
  `;

  clearDetailPanelState("Data load error");
}

// Display empty state when roasts dataset is empty
function showEmptyRoastsState() {
  selectedRoast = null;
  compareRoastA = null;
  compareRoastB = null;
  if (roastCountEl) roastCountEl.textContent = "0";
  if (filteredCount) filteredCount.textContent = "0";

  roastsGrid.innerHTML = `<div class="empty-msg">No roasts found. Run export to generate data.</div>`;
  clearDetailPanelState("No roasts available");
}

// Fetch roast journal data
async function loadRoastsData() {
  roastsGrid.innerHTML = `
    <div class="roast-list-loading" aria-live="polite">
      <div class="loading-spinner"></div>
      <span>Loading roast journal…</span>
    </div>
  `;

  try {
    const res = await fetch(`data/roasts.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    roastsData = json.roasts || [];
    if (roastCountEl) roastCountEl.textContent = roastsData.length;

    if (roastsData.length === 0) {
      showEmptyRoastsState();
      return;
    }

    selectedRoast = roastsData[0];
    compareRoastA = roastsData[0];
    compareRoastB = null; // Default compare state is [Current | Empty]

    renderRoastsList();

    if (!isCompareMode) {
      renderSingleDetail(selectedRoast);
    } else {
      renderCompareView();
    }
  } catch (err) {
    console.error("Error loading roast data:", err);
    showNetworkErrorState(err.message || "Failed to load roasts");
  }
}

// Initialization
async function init() {
  setupTheme();
  setupSidebarState();
  setupEventListeners();
  setupCanvasResizeObservers();
  await loadRoastsData();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  document.body.classList.toggle("light-theme", !isDark);
  document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
    const moonIcon = btn.querySelector(".theme-icon-moon");
    const sunIcon = btn.querySelector(".theme-icon-sun");
    if (moonIcon && sunIcon) {
      moonIcon.classList.toggle("hidden", isDark);
      sunIcon.classList.toggle("hidden", !isDark);
    }
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  });
}

function setupTheme() {
  const saved = localStorage.getItem("roast_journal_theme") || "light";
  applyTheme(saved);
}

function toggleTheme() {
  const isCurrentlyDark = document.body.classList.contains("dark-theme");
  const nextTheme = isCurrentlyDark ? "light" : "dark";
  localStorage.setItem("roast_journal_theme", nextTheme);
  applyTheme(nextTheme);
  redrawAllActiveCharts();
}

// Mobile drawer and sidebar collapse handling and ARIA sync
function setMobileSidebarOpen(isOpen) {
  const open = Boolean(isOpen);
  document.body.classList.toggle("sidebar-mobile-open", open);
  if (mobileSidebarToggle) {
    mobileSidebarToggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileSidebarToggle.setAttribute("aria-label", open ? "Close roast list drawer" : "Open roast list drawer");
  }
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.setAttribute("aria-expanded", open ? "true" : "false");
    sidebarCollapseBtn.setAttribute("aria-label", open ? "Close roast list drawer" : "Open roast list drawer");
    sidebarCollapseBtn.setAttribute("title", open ? "Close roast list drawer" : "Open roast list drawer");
  }
}

function toggleMobileSidebar() {
  const isOpen = document.body.classList.contains("sidebar-mobile-open");
  setMobileSidebarOpen(!isOpen);
}

function updateSidebarAria(isCollapsed) {
  const expandedStr = isCollapsed ? "false" : "true";
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.setAttribute("aria-expanded", expandedStr);
    const isMobile = window.innerWidth <= 1080;
    sidebarCollapseBtn.setAttribute("aria-label", isMobile ? "Close roast list drawer" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar"));
    sidebarCollapseBtn.setAttribute("title", isMobile ? "Close roast list drawer" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar"));
  }
  if (singleSidebarToggle) singleSidebarToggle.setAttribute("aria-expanded", expandedStr);
  if (compareSidebarToggle) compareSidebarToggle.setAttribute("aria-expanded", expandedStr);
}

function setupSidebarState() {
  if (window.innerWidth <= 1080) {
    setMobileSidebarOpen(false);
  }
  const isCollapsed = localStorage.getItem("roast_journal_sidebar_collapsed") === "true";
  if (workspaceLayout) {
    workspaceLayout.classList.toggle("sidebar-collapsed", isCollapsed);
  }
  updateSidebarAria(isCollapsed);
}

function toggleSidebar(forceCollapsed) {
  if (window.innerWidth <= 1080) {
    const isCurrentlyOpen = document.body.classList.contains("sidebar-mobile-open");
    const willBeOpen = typeof forceCollapsed === "boolean"
      ? !forceCollapsed
      : !isCurrentlyOpen;
    setMobileSidebarOpen(willBeOpen);
    return;
  }
  if (!workspaceLayout) return;
  const isCollapsed = typeof forceCollapsed === "boolean"
    ? forceCollapsed
    : !workspaceLayout.classList.contains("sidebar-collapsed");

  workspaceLayout.classList.toggle("sidebar-collapsed", isCollapsed);
  localStorage.setItem("roast_journal_sidebar_collapsed", isCollapsed ? "true" : "false");
  updateSidebarAria(isCollapsed);

  // Redraw charts cleanly as stage smoothly finishes expanding/collapsing
  setTimeout(() => {
    redrawAllActiveCharts();
  }, 400);
}

// Active compare slot handling (Slot A vs Slot B)
function setActiveCompareSlot(slot) {
  activeCompareSlot = slot === "B" ? "B" : "A";
  const isA = activeCompareSlot === "A";

  if (targetSlotABtn) {
    targetSlotABtn.classList.toggle("active", isA);
    targetSlotABtn.setAttribute("aria-pressed", isA ? "true" : "false");
  }
  if (targetSlotBBtn) {
    targetSlotBBtn.classList.toggle("active", !isA);
    targetSlotBBtn.setAttribute("aria-pressed", !isA ? "true" : "false");
  }

  if (btnFocusColA) {
    btnFocusColA.classList.toggle("active", isA);
    btnFocusColA.setAttribute("aria-pressed", isA ? "true" : "false");
  }
  if (btnFocusColB) {
    btnFocusColB.classList.toggle("active", !isA);
    btnFocusColB.setAttribute("aria-pressed", !isA ? "true" : "false");
  }

  if (colRoastA) colRoastA.classList.toggle("active-target", isA);
  if (colRoastB) colRoastB.classList.toggle("active-target", !isA);
}

// Compare view mode handling (superimposed overlay vs side-by-side split)
function setCompareViewMode(mode) {
  compareViewMode = mode === "split" ? "split" : "overlay";
  const isOverlay = compareViewMode === "overlay";
  if (btnViewOverlay) {
    btnViewOverlay.classList.toggle("active", isOverlay);
    btnViewOverlay.setAttribute("aria-pressed", isOverlay ? "true" : "false");
  }
  if (btnViewSplit) {
    btnViewSplit.classList.toggle("active", !isOverlay);
    btnViewSplit.setAttribute("aria-pressed", !isOverlay ? "true" : "false");
  }
  renderCompareView();
}

// Synchronize active channel legend buttons across all view panels
function syncChannelLegendButtons() {
  document.querySelectorAll(".channel-chip").forEach((btn) => {
    const ch = btn.dataset.channel;
    if (ch && Object.prototype.hasOwnProperty.call(visibleChannels, ch)) {
      const isActive = Boolean(visibleChannels[ch]);
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  });
}

// Toggle individual channel and update UI
function toggleChannel(ch) {
  if (ch && Object.prototype.hasOwnProperty.call(visibleChannels, ch)) {
    visibleChannels[ch] = !visibleChannels[ch];
    syncChannelLegendButtons();
    redrawAllActiveCharts();
  }
}

// Swap roasts A and B
function swapCompareRoasts() {
  const temp = compareRoastA;
  compareRoastA = compareRoastB;
  compareRoastB = temp;
  if (!compareRoastA && compareRoastB) {
    compareRoastA = compareRoastB;
    compareRoastB = null;
  }
  renderCompareView();
  renderRoastsList();
}

// Compare mode handling
function toggleCompareMode(forceState) {
  isCompareMode = typeof forceState === "boolean" ? forceState : !isCompareMode;

  if (workspaceLayout) workspaceLayout.classList.toggle("compare-active", isCompareMode);
  if (sidebarCompareToggle) {
    sidebarCompareToggle.classList.toggle("active", isCompareMode);
    sidebarCompareToggle.setAttribute("aria-pressed", isCompareMode ? "true" : "false");
  }
  if (sidebarCompareBtnText) sidebarCompareBtnText.textContent = isCompareMode ? "Comparing" : "Compare";
  if (compareSlotPicker) compareSlotPicker.classList.toggle("hidden", !isCompareMode);
  if (detailPanel) detailPanel.classList.toggle("hidden", isCompareMode);
  if (comparePanel) comparePanel.classList.toggle("hidden", !isCompareMode);

  if (isCompareMode) {
    if (!compareRoastA && roastsData.length > 0) {
      compareRoastA = selectedRoast || roastsData[0];
    }
    // Default state when entering compare is [Current | Empty], targeting Slot B
    if (!compareRoastB) {
      activeCompareSlot = "B";
    }
    setActiveCompareSlot(activeCompareSlot || "B");
    renderCompareView();
  } else {
    if (selectedRoast) renderSingleDetail(selectedRoast);
  }

  renderRoastsList();
}

// Event listeners
function setupEventListeners() {
  document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });
  
  // Mobile sidebar drawer
  if (mobileSidebarToggle) mobileSidebarToggle.addEventListener("click", () => toggleMobileSidebar());
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", () => setMobileSidebarOpen(false));

  // Touch swipe to close mobile sidebar drawer
  const sidebarPanelEl = document.querySelector(".sidebar-panel");
  if (sidebarPanelEl) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDiffX = 0;

    sidebarPanelEl.addEventListener("touchstart", (e) => {
      if (!document.body.classList.contains("sidebar-mobile-open") || !e.touches || e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDiffX = 0;
    }, { passive: true });

    sidebarPanelEl.addEventListener("touchmove", (e) => {
      if (!document.body.classList.contains("sidebar-mobile-open") || !e.touches || e.touches.length === 0) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffY = Math.abs(currentY - touchStartY);
      touchDiffX = currentX - touchStartX;
    }, { passive: true });

    sidebarPanelEl.addEventListener("touchend", () => {
      if (!document.body.classList.contains("sidebar-mobile-open")) return;
      if (touchDiffX < -50) {
        setMobileSidebarOpen(false);
      }
    });
  }

  // Sidebar toggles
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener("click", () => {
      if (window.innerWidth <= 1080) {
        setMobileSidebarOpen(false);
      } else {
        toggleSidebar(true);
      }
    });
  }
  if (sidebarPeekStrip) {
    sidebarPeekStrip.addEventListener("click", () => toggleSidebar(false));
    sidebarPeekStrip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSidebar(false);
      }
    });
  }
  if (singleSidebarToggle) {
    singleSidebarToggle.addEventListener("click", () => {
      if (window.innerWidth <= 1080) {
        setMobileSidebarOpen(true);
      } else {
        toggleSidebar(false);
      }
    });
  }
  if (compareSidebarToggle) {
    compareSidebarToggle.addEventListener("click", () => {
      if (window.innerWidth <= 1080) {
        setMobileSidebarOpen(true);
      } else {
        toggleSidebar(false);
      }
    });
  }

  // Compare mode toggles and slot selection
  if (sidebarCompareToggle) sidebarCompareToggle.addEventListener("click", () => toggleCompareMode());
  if (exitCompareBtn) exitCompareBtn.addEventListener("click", () => toggleCompareMode(false));
  if (pickerExitBtn) pickerExitBtn.addEventListener("click", () => toggleCompareMode(false));

  if (targetSlotABtn) targetSlotABtn.addEventListener("click", () => setActiveCompareSlot("A"));
  if (targetSlotBBtn) targetSlotBBtn.addEventListener("click", () => setActiveCompareSlot("B"));
  if (btnFocusColA) btnFocusColA.addEventListener("click", () => setActiveCompareSlot("A"));
  if (btnFocusColB) btnFocusColB.addEventListener("click", () => setActiveCompareSlot("B"));

  if (pickerSwapBtn) pickerSwapBtn.addEventListener("click", swapCompareRoasts);
  if (swapCompareBtn) swapCompareBtn.addEventListener("click", swapCompareRoasts);

  if (btnViewOverlay) {
    btnViewOverlay.addEventListener("click", () => setCompareViewMode("overlay"));
  }
  if (btnViewSplit) {
    btnViewSplit.addEventListener("click", () => setCompareViewMode("split"));
  }

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.classList.toggle("hidden", searchQuery === "");
    renderRoastsList();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    renderRoastsList();
  });

  processFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      processFilterBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      currentProcess = btn.dataset.process;
      renderRoastsList();
    });
  });

  // Delegated event listener on roast list grid
  setupRoastsGridDelegation();

  // Channel toggle buttons (synchronized across single detail and compare headers)
  document.querySelectorAll(".channel-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const channel = btn.dataset.channel;
      if (channel) toggleChannel(channel);
    });
  });

  // Hero & compare 3-dots action menu buttons
  const heroMoreBtn = document.getElementById("hero-more-btn");
  if (heroMoreBtn) {
    heroMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedRoast) showContextMenu(e, selectedRoast, heroMoreBtn);
    });
  }

  const cmpAMoreBtn = document.getElementById("cmp-a-more-btn");
  if (cmpAMoreBtn) {
    cmpAMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (compareRoastA) showContextMenu(e, compareRoastA, cmpAMoreBtn);
    });
  }

  const cmpBMoreBtn = document.getElementById("cmp-b-more-btn");
  if (cmpBMoreBtn) {
    cmpBMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (compareRoastB) showContextMenu(e, compareRoastB, cmpBMoreBtn);
    });
  }

  // Dismiss context menu on click outside, resize, or escape
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#roast-context-menu")) {
      hideContextMenu();
    }
  });

  if (roastContextMenu) {
    roastContextMenu.addEventListener("keydown", (evt) => {
      const items = Array.from(roastContextMenu.querySelectorAll(".context-menu-item"));
      if (!items.length) return;
      const currentIndex = items.indexOf(document.activeElement);

      if (evt.key === "ArrowDown") {
        evt.preventDefault();
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[nextIndex].focus();
      } else if (evt.key === "ArrowUp") {
        evt.preventDefault();
        const prevIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
        items[prevIndex].focus();
      } else if (evt.key === "Home") {
        evt.preventDefault();
        items[0].focus();
      } else if (evt.key === "End") {
        evt.preventDefault();
        items[items.length - 1].focus();
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        hideContextMenu();
      } else if (evt.key === "Tab") {
        hideContextMenu();
      }
    });
  }

  // Global keyboard accelerators
  document.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    const isEditingText = activeEl && (
      activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.tagName === "SELECT" ||
      activeEl.isContentEditable
    );

    // Escape handling
    if (e.key === "Escape") {
      if (document.body.classList.contains("sidebar-mobile-open")) {
        e.preventDefault();
        setMobileSidebarOpen(false);
        if (mobileSidebarToggle) mobileSidebarToggle.focus();
        return;
      }
      if (activeEl === searchInput) {
        e.preventDefault();
        searchInput.value = "";
        searchQuery = "";
        clearSearchBtn.classList.add("hidden");
        renderRoastsList();
        searchInput.blur();
        return;
      }
      if (roastContextMenu && !roastContextMenu.classList.contains("hidden")) {
        e.preventDefault();
        hideContextMenu();
        return;
      }
      if (isCompareMode) {
        e.preventDefault();
        toggleCompareMode(false);
        return;
      }
    }

    if (isEditingText) return;

    // Focus search accelerator: /
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // Compare mode toggle: c / C
    if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleCompareMode();
      return;
    }

    // Swap compare roasts: s / S
    if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isCompareMode) {
        e.preventDefault();
        swapCompareRoasts();
      }
      return;
    }

    // Channel toggles: 1 = BT, 2 = ET, 3 = RoR, 4 = Heat, 5 = Fan
    if (["1", "2", "3", "4", "5"].includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const channelMap = {
        "1": "bt",
        "2": "et",
        "3": "ror",
        "4": "heat",
        "5": "fan",
      };
      const ch = channelMap[e.key];
      if (ch) toggleChannel(ch);
      return;
    }

    // List navigation: j / ArrowDown -> next, k / ArrowUp -> prev
    if ((e.key === "j" || e.key === "ArrowDown") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (roastContextMenu && !roastContextMenu.classList.contains("hidden")) return;
      e.preventDefault();
      navigateRoastSelection(1);
      return;
    }

    if ((e.key === "k" || e.key === "ArrowUp") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (roastContextMenu && !roastContextMenu.classList.contains("hidden")) return;
      e.preventDefault();
      navigateRoastSelection(-1);
      return;
    }
  });

  window.addEventListener("scroll", hideContextMenu, true);
  window.addEventListener("resize", () => {
    hideContextMenu();
    if (window.innerWidth > 1080 && document.body.classList.contains("sidebar-mobile-open")) {
      setMobileSidebarOpen(false);
    }
    debouncedRedrawCharts();
  });
}

// Delegated event handling on the roasts grid container
function setupRoastsGridDelegation() {
  if (!roastsGrid) return;

  roastsGrid.addEventListener("click", (e) => {
    // Retry button click
    if (e.target.closest("#retry-fetch-btn")) {
      e.preventDefault();
      loadRoastsData();
      return;
    }

    // Card find
    const card = e.target.closest(".roast-card-item");
    if (!card) return;
    const file = card.dataset.file;
    const roast = roastsData.find((r) => r.file === file);
    if (!roast) return;

    // Quick assign A button
    const assignABtn = e.target.closest(".btn-assign-a");
    if (assignABtn) {
      e.stopPropagation();
      compareRoastA = roast;
      setActiveCompareSlot("B");
      renderCompareView();
      renderRoastsList();
      if (window.innerWidth <= 1080) {
        setMobileSidebarOpen(false);
      }
      return;
    }

    // Quick assign B button
    const assignBBtn = e.target.closest(".btn-assign-b");
    if (assignBBtn) {
      e.stopPropagation();
      compareRoastB = roast;
      setActiveCompareSlot("A");
      renderCompareView();
      renderRoastsList();
      if (window.innerWidth <= 1080) {
        setMobileSidebarOpen(false);
      }
      return;
    }

    // Options (3-dots) button
    const moreBtn = e.target.closest(".card-more-btn");
    if (moreBtn) {
      e.stopPropagation();
      showContextMenu(e, roast, moreBtn);
      return;
    }

    // Regular card click
    handleRoastCardActivation(roast);
  });

  // Right-click context menu delegation
  roastsGrid.addEventListener("contextmenu", (e) => {
    const card = e.target.closest(".roast-card-item");
    if (!card) return;
    const file = card.dataset.file;
    const roast = roastsData.find((r) => r.file === file);
    if (roast) {
      e.preventDefault();
      showContextMenu(e, roast);
    }
  });

  // Keyboard delegation for Enter / Space
  roastsGrid.addEventListener("keydown", (e) => {
    const card = e.target.closest(".roast-card-item");
    if (!card || e.target !== card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const file = card.dataset.file;
      const roast = roastsData.find((r) => r.file === file);
      if (roast) {
        handleRoastCardActivation(roast);
      }
    }
  });
}

// Handle roast selection or compare assignment on card activation
function handleRoastCardActivation(roast) {
  if (!roast) return;
  if (!isCompareMode) {
    selectRoast(roast);
  } else {
    if (activeCompareSlot === "A") {
      compareRoastA = roast;
      setActiveCompareSlot("B");
    } else {
      compareRoastB = roast;
      setActiveCompareSlot("A");
    }
    renderCompareView();
    renderRoastsList();
  }

  // Automatically close mobile sidebar drawer on card selection
  if (window.innerWidth <= 1080) {
    setMobileSidebarOpen(false);
  }
}

// Navigate selection in roasts list via keyboard
function navigateRoastSelection(direction) {
  const filtered = getFilteredRoasts();
  if (filtered.length === 0) return;

  let currentRoast = null;
  if (!isCompareMode) {
    currentRoast = selectedRoast;
  } else {
    currentRoast = activeCompareSlot === "A" ? compareRoastA : compareRoastB;
    if (!currentRoast) currentRoast = compareRoastA || selectedRoast;
  }

  let currentIndex = currentRoast ? filtered.findIndex((r) => r.file === currentRoast.file) : -1;
  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = direction > 0 ? 0 : filtered.length - 1;
  } else {
    nextIndex = Math.max(0, Math.min(filtered.length - 1, currentIndex + direction));
  }

  const nextRoast = filtered[nextIndex];
  if (!nextRoast) return;

  if (!isCompareMode) {
    selectRoast(nextRoast);
  } else {
    if (activeCompareSlot === "A") {
      compareRoastA = nextRoast;
    } else {
      compareRoastB = nextRoast;
    }
    renderCompareView();
    renderRoastsList();
  }

  const targetCard = document.querySelector(`.roast-card-item[data-file="${CSS.escape(nextRoast.file)}"]`);
  if (targetCard) {
    targetCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (document.activeElement && document.activeElement.classList.contains("roast-card-item")) {
      targetCard.focus();
    }
  }
}

// Filter roasts
function getFilteredRoasts() {
  return roastsData.filter((r) => {
    const matchesProcess =
      currentProcess === "all" ||
      (r.process || "").toLowerCase().includes(currentProcess.toLowerCase());

    const searchTarget = [
      r.bean,
      r.origin,
      r.region,
      r.varietal,
      r.flavour_notes,
      r.cupping_notes,
      r.goal,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchQuery === "" || searchTarget.includes(searchQuery);
    return matchesProcess && matchesSearch;
  });
}

// Context menu helper
function showContextMenu(e, roast, anchorEl = null) {
  if (!roastContextMenu || !roast) return;
  activeContextMenuRoast = roast;
  lastFocusedContextMenuTrigger = anchorEl || document.activeElement;

  let x, y;
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    x = rect.left;
    y = rect.bottom + 4;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  const beanName = roast.bean || roast.file;
  const isSelectedA = isCompareMode && compareRoastA?.file === roast.file;
  const isSelectedB = isCompareMode && compareRoastB?.file === roast.file;
  const isSelectedSingle = !isCompareMode && selectedRoast?.file === roast.file;

  let menuHtml = `<div class="context-menu-header" title="${escapeHtml(beanName)}">${escapeHtml(beanName)}</div>`;

  if (!isCompareMode) {
    if (selectedRoast && selectedRoast.file !== roast.file) {
      const currentName = selectedRoast.bean || "selected roast";
      const shortName = currentName.length > 18 ? currentName.slice(0, 16) + "…" : currentName;
      menuHtml += `
        <button class="context-menu-item primary" data-action="compare-with-current" role="menuitem" tabindex="-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="18" rx="1.5"></rect><rect x="13" y="3" width="8" height="18" rx="1.5"></rect></svg>
          <span>Compare with ${escapeHtml(shortName)}</span>
        </button>
      `;
    } else {
      menuHtml += `
        <button class="context-menu-item primary" data-action="start-compare" role="menuitem" tabindex="-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="18" rx="1.5"></rect><rect x="13" y="3" width="8" height="18" rx="1.5"></rect></svg>
          <span>Compare</span>
        </button>
      `;
    }

    if (!isSelectedSingle) {
      menuHtml += `
        <button class="context-menu-item" data-action="view-single" role="menuitem" tabindex="-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>View details</span>
        </button>
      `;
    }
  } else {
    menuHtml += `
      <button class="context-menu-item action-a ${isSelectedA ? "active" : ""}" data-action="set-roast-a" role="menuitem" tabindex="-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line></svg>
        <span>Set as Roast A (left)</span>
      </button>
      <button class="context-menu-item action-b ${isSelectedB ? "active" : ""}" data-action="set-roast-b" role="menuitem" tabindex="-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <span>Set as Roast B (right)</span>
      </button>
      <button class="context-menu-item" data-action="view-single" role="menuitem" tabindex="-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span>View only this roast</span>
      </button>
    `;
  }

  menuHtml += `
    <div class="context-menu-divider"></div>
    <button class="context-menu-item" data-action="download-alog" role="menuitem" tabindex="-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      <span>Download .alog</span>
    </button>
  `;

  roastContextMenu.innerHTML = menuHtml;
  roastContextMenu.classList.remove("hidden");

  // Keep menu within screen boundaries
  const menuRect = roastContextMenu.getBoundingClientRect();
  const pad = 8;
  if (x + menuRect.width > window.innerWidth - pad) {
    x = Math.max(pad, window.innerWidth - menuRect.width - pad);
  }
  if (y + menuRect.height > window.innerHeight - pad) {
    y = Math.max(pad, window.innerHeight - menuRect.height - pad);
  }

  roastContextMenu.style.left = `${Math.max(pad, x)}px`;
  roastContextMenu.style.top = `${Math.max(pad, y)}px`;

  // Attach action handlers to menu items
  roastContextMenu.querySelectorAll(".context-menu-item").forEach((btn) => {
    btn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      handleContextMenuAction(btn.dataset.action, activeContextMenuRoast);
      hideContextMenu();
    });
  });

  // Focus first menu item for roving focus
  const firstItem = roastContextMenu.querySelector(".context-menu-item");
  if (firstItem) {
    firstItem.focus();
  }
}

function hideContextMenu() {
  if (roastContextMenu && !roastContextMenu.classList.contains("hidden")) {
    roastContextMenu.classList.add("hidden");
    activeContextMenuRoast = null;
    if (lastFocusedContextMenuTrigger && typeof lastFocusedContextMenuTrigger.focus === "function") {
      lastFocusedContextMenuTrigger.focus();
    }
    lastFocusedContextMenuTrigger = null;
  }
}

function handleContextMenuAction(action, roast) {
  if (!roast) return;

  switch (action) {
    case "compare-with-current":
      compareRoastA = selectedRoast || roastsData[0];
      compareRoastB = roast;
      setActiveCompareSlot("B");
      toggleCompareMode(true);
      break;

    case "start-compare":
      compareRoastA = roast;
      const other = roastsData.find((r) => r.file !== roast.file) || roast;
      compareRoastB = other;
      setActiveCompareSlot("B");
      toggleCompareMode(true);
      break;

    case "set-roast-a":
      compareRoastA = roast;
      setActiveCompareSlot("B");
      renderCompareView();
      renderRoastsList();
      break;

    case "set-roast-b":
      compareRoastB = roast;
      setActiveCompareSlot("A");
      renderCompareView();
      renderRoastsList();
      break;

    case "view-single":
      if (isCompareMode) toggleCompareMode(false);
      selectRoast(roast);
      break;

    case "download-alog":
      const link = document.createElement("a");
      link.href = `curves/${encodeURIComponent(roast.file)}`;
      link.download = roast.file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
  }
}

// Render sidebar list (pure HTML rendering with delegated event handlers)
function renderRoastsList() {
  const filtered = getFilteredRoasts();
  filteredCount.textContent = `${filtered.length}`;

  if (filtered.length === 0) {
    roastsGrid.innerHTML = `<div class="empty-msg">No roasts match the current filter.</div>`;
    return;
  }

  roastsGrid.innerHTML = filtered
    .map((r) => {
      const isSelectedSingle = !isCompareMode && selectedRoast && selectedRoast.file === r.file;
      const isSelectedA = isCompareMode && compareRoastA && compareRoastA.file === r.file;
      const isSelectedB = isCompareMode && compareRoastB && compareRoastB.file === r.file;

      let cardClass = "roast-card-item";
      if (isSelectedSingle) cardClass += " selected";
      if (isSelectedA) cardClass += " selected-a";
      if (isSelectedB) cardClass += " selected-b";

      const dtrStr = r.phases?.dtr_pct != null && r.phases.dtr_pct > 0 ? `${r.phases.dtr_pct}% DTR` : "0% DTR";
      const totalTimeStr = formatTime(r.phases?.total_time_s);
      const lossStr = r.loss_pct != null ? `-${r.loss_pct}% loss` : "-";
      const weightStr = r.weight_in_g ? `${r.weight_in_g}g in` : "";

      let slotBadge = "";
      if (isCompareMode) {
        if (isSelectedA) slotBadge += `<span class="card-slot-badge slot-a">A</span>`;
        if (isSelectedB) slotBadge += `<span class="card-slot-badge slot-b">B</span>`;
      }

      const quickAssignHtml = isCompareMode
        ? `
          <div class="card-slot-actions">
            <button class="btn-assign-slot btn-assign-a" data-action="assign-a" title="Set as Roast A (left)" aria-label="Set ${escapeHtml(r.bean || r.file)} as Roast A (left)">A</button>
            <button class="btn-assign-slot btn-assign-b" data-action="assign-b" title="Set as Roast B (right)" aria-label="Set ${escapeHtml(r.bean || r.file)} as Roast B (right)">B</button>
          </div>
        `
        : "";

      const originParts = [r.origin, r.process].filter(Boolean);
      const originProcessStr = originParts.join(" · ") || "Single origin";
      const scoreBadgeHtml = r.score ? formatScoreHtml(r.score) : "";

      return `
        <div class="${cardClass}" data-file="${r.file}" tabindex="0" aria-label="${escapeHtml(r.bean || r.file)}">
          <div class="card-headline">
            <span class="card-title-text">${escapeHtml(r.bean || "Unnamed roast")}${slotBadge}</span>
            <div class="card-headline-right">
              ${quickAssignHtml}
              <span class="card-date-text">${r.roast_date || ""}</span>
              <button class="card-more-btn" title="Options" aria-label="Roast options for ${escapeHtml(r.bean || r.file)}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle><circle cx="5" cy="12" r="1.5"></circle></svg>
              </button>
            </div>
          </div>
          <div class="card-meta-row">
            <span class="card-origin-process">${escapeHtml(originProcessStr)}</span>
            ${scoreBadgeHtml}
          </div>
          <div class="card-stat-line">
            <span>${totalTimeStr} <span class="stat-dot">•</span> ${dtrStr}</span>
            <span>${weightStr ? `${weightStr} (${lossStr})` : lossStr}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

// Select roast (single mode)
function selectRoast(roast) {
  selectedRoast = roast;
  renderSingleDetail(roast);
  renderRoastsList();
  if (window.innerWidth <= 1080) {
    setMobileSidebarOpen(false);
  }
}

// Render single detail panel
function renderSingleDetail(roast) {
  if (!roast) return;

  // Roast header
  detailTitle.textContent = roast.bean || roast.file;
  
  // Tags
  detailOrigin.textContent = roast.origin || "Unknown origin";
  detailProcess.textContent = roast.process || "Unknown process";
  detailDate.textContent = formatDateTime(roast.roast_date, roast.roast_time);

  const purposeStr = roast.purpose ? `${toTitleCase(roast.purpose)} roast` : "Filter roast";
  const regionParts = [
    roast.region,
    roast.varietal,
    roast.altitude_masl ? `${roast.altitude_masl} masl` : null,
    purposeStr,
  ].filter(Boolean);
  detailRegionVarietal.textContent = regionParts.join(" • ") || "Single origin roast";

  downloadAlogBtn.href = `curves/${encodeURIComponent(roast.file)}`;
  downloadAlogBtn.download = roast.file;

  // Metrics
  if (metricWeight) {
    if (roast.weight_in_g && roast.weight_out_g) {
      metricWeight.innerHTML = `${roast.weight_in_g}g → ${roast.weight_out_g}g <span class="loss-pill">(-${roast.loss_pct}%)</span>`;
    } else if (roast.weight_in_g) {
      metricWeight.textContent = `${roast.weight_in_g}g in`;
    } else {
      metricWeight.textContent = "-";
    }
  }

  if (metricTotalTime) {
    metricTotalTime.textContent = formatTime(roast.phases?.total_time_s);
  }
  
  if (metricDtr) {
    if (roast.phases?.dtr_pct != null && roast.phases.dtr_pct > 0) {
      metricDtr.innerHTML = `${roast.phases.dtr_pct}% <span class="sub-pill">${roast.phases.dtr_pct < 10 ? "Filter" : "Omni"}</span>`;
    } else {
      metricDtr.innerHTML = `0.0% <span class="sub-pill">No FC</span>`;
    }
  }

  if (metricFc) {
    if (roast.milestones?.fc_time) {
      metricFc.innerHTML = `${formatTime(roast.milestones.fc_time)} <span class="sub-pill">@ ${roast.milestones.fc_bt != null ? roast.milestones.fc_bt.toFixed(1) : "-"}°C</span>`;
    } else {
      metricFc.innerHTML = `None <span class="sub-pill">@ ${roast.milestones?.drop_bt != null ? roast.milestones.drop_bt.toFixed(1) : "-"}°C</span>`;
    }
  }

  if (metricDrop) {
    if (roast.milestones?.drop_bt != null) {
      metricDrop.textContent = `${roast.milestones.drop_bt.toFixed(1)}°C`;
    } else {
      metricDrop.textContent = "-";
    }
  }

  if (metricScore) {
    metricScore.innerHTML = formatScoreHtml(roast.score);
  }

  // Phase timeline
  renderPhaseTimeline(
    roast,
    barDry,
    barMid,
    barFinish,
    labelDry,
    labelMid,
    labelFinish
  );

  // Flavor tags with SCA color coding
  detailFlavourChips.innerHTML = renderFlavorChipsHtml(roast.flavour_notes);

  // Cupping and goal notes
  detailCuppingNotes.textContent = roast.cupping_notes || roast.verdict || "No cupping notes recorded.";
  detailGoal.textContent = roast.goal || "Standard profile";

  // Draw chart
  drawChart(roast, curveCanvas, chartTooltip);
}

// Render phase timeline bars
function renderPhaseTimeline(roast, barD, barM, barF, lblD, lblM, lblF) {
  const total = roast.phases?.total_time_s || 1;
  const dry = roast.phases?.dry_time_s || 0;
  let mid = roast.phases?.mid_time_s || 0;
  let finish = roast.phases?.finish_time_s || 0;

  if (!roast.milestones?.fc_time && dry > 0) {
    mid = Math.max(0, total - dry);
    finish = 0;
  }

  const dryPct = Math.max(0, Math.min(100, (dry / total) * 100));
  const midPct = Math.max(0, Math.min(100, (mid / total) * 100));
  const finishPct = Math.max(0, Math.min(100, (finish / total) * 100));

  if (barD) barD.style.width = `${dryPct}%`;
  if (barM) barM.style.width = `${midPct}%`;
  if (barF) barF.style.width = `${finishPct}%`;

  if (lblD) lblD.textContent = `Drying: ${formatTime(dry)} (${dryPct.toFixed(0)}%)`;
  if (lblM) lblM.textContent = `Maillard: ${formatTime(mid)} (${midPct.toFixed(0)}%)`;
  if (lblF) lblF.textContent = `Development: ${formatTime(finish)} (${finishPct.toFixed(0)}%)`;
}

// Render column helper for compare mode
function populateCompareColumn(roast, prefix, canvasEl, tooltipEl) {
  if (!roast) return;

  const originEl = document.getElementById(`${prefix}-origin`);
  const processEl = document.getElementById(`${prefix}-process`);
  const dateEl = document.getElementById(`${prefix}-date`);
  const titleEl = document.getElementById(`${prefix}-title`);
  const pedigreeEl = document.getElementById(`${prefix}-pedigree`);
  const downloadEl = document.getElementById(`${prefix}-download`);

  const weightEl = document.getElementById(`${prefix}-weight`);
  const totalTimeEl = document.getElementById(`${prefix}-total-time`);
  const dtrEl = document.getElementById(`${prefix}-dtr`);
  const fcEl = document.getElementById(`${prefix}-fc`);
  const dropEl = document.getElementById(`${prefix}-drop`);
  const scoreEl = document.getElementById(`${prefix}-score`);

  const barD = document.getElementById(`${prefix}-bar-dry`);
  const barM = document.getElementById(`${prefix}-bar-mid`);
  const barF = document.getElementById(`${prefix}-bar-finish`);
  const lblD = document.getElementById(`${prefix}-label-dry`);
  const lblM = document.getElementById(`${prefix}-label-mid`);
  const lblF = document.getElementById(`${prefix}-label-finish`);

  const flavourEl = document.getElementById(`${prefix}-flavour-chips`);
  const goalEl = document.getElementById(`${prefix}-goal`);
  const cuppingEl = document.getElementById(`${prefix}-cupping-notes`);

  if (originEl) originEl.textContent = roast.origin || "Unknown origin";
  if (processEl) processEl.textContent = roast.process || "Unknown process";
  if (dateEl) dateEl.textContent = formatDateTime(roast.roast_date, roast.roast_time);
  if (titleEl) titleEl.textContent = roast.bean || roast.file;

  const purposeStr = roast.purpose ? `${toTitleCase(roast.purpose)} roast` : "Filter roast";
  const regionParts = [
    roast.region,
    roast.varietal,
    roast.altitude_masl ? `${roast.altitude_masl} masl` : null,
    purposeStr,
  ].filter(Boolean);
  if (pedigreeEl) pedigreeEl.textContent = regionParts.join(" • ") || "Single origin roast";

  if (downloadEl) {
    downloadEl.href = `curves/${encodeURIComponent(roast.file)}`;
    downloadEl.download = roast.file;
  }

  if (weightEl) {
    if (roast.weight_in_g && roast.weight_out_g) {
      weightEl.innerHTML = `${roast.weight_in_g}g → ${roast.weight_out_g}g <span class="loss-pill">(-${roast.loss_pct}%)</span>`;
    } else if (roast.weight_in_g) {
      weightEl.textContent = `${roast.weight_in_g}g in`;
    } else {
      weightEl.textContent = "-";
    }
  }

  if (totalTimeEl) totalTimeEl.textContent = formatTime(roast.phases?.total_time_s);
  
  if (dtrEl) {
    if (roast.phases?.dtr_pct != null && roast.phases.dtr_pct > 0) {
      dtrEl.innerHTML = `${roast.phases.dtr_pct}% <span class="sub-pill">${roast.phases.dtr_pct < 10 ? "Filter" : "Omni"}</span>`;
    } else {
      dtrEl.innerHTML = `0.0% <span class="sub-pill">No FC</span>`;
    }
  }

  if (fcEl) {
    if (roast.milestones?.fc_time) {
      fcEl.innerHTML = `${formatTime(roast.milestones.fc_time)} <span class="sub-pill">@ ${roast.milestones.fc_bt != null ? roast.milestones.fc_bt.toFixed(1) : "-"}°C</span>`;
    } else {
      fcEl.innerHTML = `None <span class="sub-pill">@ ${roast.milestones?.drop_bt != null ? roast.milestones.drop_bt.toFixed(1) : "-"}°C</span>`;
    }
  }

  if (dropEl) {
    if (roast.milestones?.drop_bt != null) {
      dropEl.textContent = `${roast.milestones.drop_bt.toFixed(1)}°C`;
    } else {
      dropEl.textContent = "-";
    }
  }

  if (scoreEl) {
    scoreEl.innerHTML = formatScoreHtml(roast.score);
  }

  renderPhaseTimeline(roast, barD, barM, barF, lblD, lblM, lblF);

  if (flavourEl) {
    flavourEl.innerHTML = renderFlavorChipsHtml(roast.flavour_notes);
  }

  if (goalEl) goalEl.textContent = roast.goal || "Standard profile";
  if (cuppingEl) cuppingEl.textContent = roast.cupping_notes || roast.verdict || "No cupping notes recorded.";

  drawChart(roast, canvasEl, tooltipEl, false);
}

// Render compare view
function renderCompareView() {
  if (!compareRoastA) return;

  if (pickerNameA) pickerNameA.textContent = compareRoastA.bean || "Current";
  if (pickerNameB) pickerNameB.textContent = compareRoastB ? (compareRoastB.bean || "Roast B") : "Empty";
  setActiveCompareSlot(activeCompareSlot);

  // 1. Populate Side-by-Side Column A
  populateCompareColumn(compareRoastA, "cmp-a", cmpCanvasA, cmpTooltipA);

  const cmpBContent = document.getElementById("cmp-b-content");
  const cmpBEmpty = document.getElementById("cmp-b-empty");
  const emptyCmpAName = document.getElementById("empty-cmp-a-name");

  // 2. Populate Side-by-Side Column B or show empty placeholder
  if (compareRoastB) {
    if (cmpBContent) cmpBContent.classList.remove("hidden");
    if (cmpBEmpty) cmpBEmpty.classList.add("hidden");
    populateCompareColumn(compareRoastB, "cmp-b", cmpCanvasB, cmpTooltipB);

    // Compute deltas (B vs A)
    if (compareDeltaChips) {
      const deltas = [];

      // Total time delta
      const timeA = compareRoastA.phases?.total_time_s;
      const timeB = compareRoastB.phases?.total_time_s;
      if (timeA != null && timeB != null) {
        const diff = Math.round(timeB - timeA);
        const sign = diff >= 0 ? `+${diff}s` : `${diff}s`;
        deltas.push(`<span class="delta-chip ${diff > 0 ? "delta-pos" : "delta-neg"}">Δ Time: ${sign}</span>`);
      }

      // DTR delta
      const dtrA = compareRoastA.phases?.dtr_pct;
      const dtrB = compareRoastB.phases?.dtr_pct;
      if (dtrA != null && dtrB != null) {
        const diff = (dtrB - dtrA).toFixed(1);
        const sign = diff >= 0 ? `+${diff}%` : `${diff}%`;
        deltas.push(`<span class="delta-chip">Δ DTR: ${sign}</span>`);
      }

      // FC BT delta
      const fcA = compareRoastA.milestones?.fc_bt;
      const fcB = compareRoastB.milestones?.fc_bt;
      if (fcA != null && fcB != null) {
        const diff = (fcB - fcA).toFixed(1);
        const sign = diff >= 0 ? `+${diff}°C` : `${diff}°C`;
        deltas.push(`<span class="delta-chip">Δ FC BT: ${sign}</span>`);
      }

      // Drop BT delta
      const dropA = compareRoastA.milestones?.drop_bt;
      const dropB = compareRoastB.milestones?.drop_bt;
      if (dropA != null && dropB != null) {
        const diff = (dropB - dropA).toFixed(1);
        const sign = diff >= 0 ? `+${diff}°C` : `${diff}°C`;
        deltas.push(`<span class="delta-chip">Δ Drop BT: ${sign}</span>`);
      }

      // Weight loss delta
      const lossA = compareRoastA.loss_pct;
      const lossB = compareRoastB.loss_pct;
      if (lossA != null && lossB != null) {
        const diff = (lossB - lossA).toFixed(1);
        const sign = diff >= 0 ? `+${diff}%` : `${diff}%`;
        deltas.push(`<span class="delta-chip">Δ Loss: ${sign}</span>`);
      }

      // Cupping score delta
      const scoreA = parseFloat(compareRoastA.score);
      const scoreB = parseFloat(compareRoastB.score);
      if (!isNaN(scoreA) && !isNaN(scoreB)) {
        const diff = (scoreB - scoreA).toFixed(1);
        const sign = diff >= 0 ? `+${diff}` : `${diff}`;
        deltas.push(`<span class="delta-chip ${diff > 0 ? "delta-pos" : diff < 0 ? "delta-neg" : ""}">Δ Score: ${sign} pts</span>`);
      }

      compareDeltaChips.innerHTML = deltas.join("");
    }
  } else {
    if (cmpBContent) cmpBContent.classList.add("hidden");
    if (cmpBEmpty) cmpBEmpty.classList.remove("hidden");
    if (emptyCmpAName) emptyCmpAName.textContent = compareRoastA.bean || "Roast A";

    const originB = document.getElementById("cmp-b-origin");
    const processB = document.getElementById("cmp-b-process");
    const dateB = document.getElementById("cmp-b-date");
    if (originB) originB.textContent = "-";
    if (processB) processB.textContent = "-";
    if (dateB) dateB.textContent = "-";

    if (compareDeltaChips) {
      compareDeltaChips.innerHTML = `<span class="delta-chip">Select Roast B to compare deltas</span>`;
    }
  }

  // Toggle View Modes (Superimposed Overlay vs Side-by-Side Split)
  const isOverlay = compareViewMode === "overlay";
  if (cmpOverlayStage) cmpOverlayStage.classList.toggle("hidden", !isOverlay);
  if (compareColumnsContainer) compareColumnsContainer.classList.toggle("hidden", isOverlay);

  if (isOverlay) {
    const legA = document.getElementById("cmp-overlay-legend-a");
    const legB = document.getElementById("cmp-overlay-legend-b");
    if (legA) legA.textContent = compareRoastA.bean || "Roast A";
    if (legB) legB.textContent = compareRoastB ? (compareRoastB.bean || "Roast B") : "Roast B (Empty)";
    drawOverlayChart(compareRoastA, compareRoastB, cmpOverlayCanvas, cmpOverlayTooltip);
  } else {
    setupSideBySideScrubbing();
  }
}

// Redraw all active charts
function redrawAllActiveCharts() {
  if (isCompareMode) {
    if (compareViewMode === "overlay") {
      drawOverlayChart(compareRoastA, compareRoastB, cmpOverlayCanvas, cmpOverlayTooltip);
    } else {
      if (compareRoastA) drawChart(compareRoastA, cmpCanvasA, cmpTooltipA, false);
      if (compareRoastB) drawChart(compareRoastB, cmpCanvasB, cmpTooltipB, false);
      setupSideBySideScrubbing();
    }
  } else {
    if (selectedRoast) drawChart(selectedRoast, curveCanvas, chartTooltip, true);
  }
}

// Centralized chart padding geometry
const CHART_PADDING = Object.freeze({ top: 24, right: 40, bottom: 28, left: 45 });

// Canvas context initializer with DPR handling and dimension caching
function initCanvas(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.round(rect.width * dpr);
  const targetHeight = Math.round(rect.height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, w: rect.width, h: rect.height, dpr, rect };
}

// Catmull-Rom centripetal spline interpolation for continuous physical signals
function drawSmoothSpline(ctx, points) {
  if (!points || points.length === 0) return;
  if (points.length < 3) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

// Stepped square-wave interpolation for discrete control actuators
function drawSteppedCurve(ctx, points) {
  if (!points || points.length === 0) return;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
  }
}

// Compute scaling transformations
function getChartScales(w, h, pad, maxTime, minTemp = 20, maxTemp = 220, maxRor = 50) {
  const getX = (t) => pad.left + (t / maxTime) * (w - pad.left - pad.right);
  const getYTemp = (temp) => h - pad.bottom - ((temp - minTemp) / (maxTemp - minTemp)) * (h - pad.top - pad.bottom);
  const getYRor = (ror) => h - pad.bottom - (Math.max(0, Math.min(maxRor, ror)) / maxRor) * (h - pad.top - pad.bottom);
  return { getX, getYTemp, getYRor, maxTime };
}

// Find closest data point in a curve
function findClosestPoint(curve, targetTime) {
  if (!curve || curve.length === 0) return null;
  let closest = curve[0];
  let minDiff = Math.abs(closest.time_s - targetTime);
  for (let i = 1; i < curve.length; i++) {
    const diff = Math.abs(curve[i].time_s - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = curve[i];
    }
  }
  return closest;
}

// Common background grid & axes renderer
function drawChartGridAndAxes(ctx, w, h, pad, maxTime, getYTemp, getYRor, getX) {
  const isDark = document.body.classList.contains("dark-theme");
  ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)";
  ctx.lineWidth = 1;

  // Horizontal grid (temperature: 50, 100, 150, 200°C)
  for (let temp = 50; temp <= 200; temp += 50) {
    const y = getYTemp(temp);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = isDark ? "#a8a29e" : "#78716c";
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${temp}°C`, pad.left - 6, y + 3.5);
  }

  // Right axis (rate of rise: 10, 20, 30, 40)
  for (let r = 10; r <= 40; r += 10) {
    const y = getYRor(r);
    ctx.fillStyle = "#10b981";
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${r}`, w - pad.right + 6, y + 3.5);
  }

  // Vertical grid (time in 60s intervals)
  for (let t = 60; t < maxTime; t += 60) {
    const x = getX(t);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, h - pad.bottom);
    ctx.stroke();

    ctx.fillStyle = isDark ? "#a8a29e" : "#78716c";
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(formatTime(t), x, h - pad.bottom + 16);
  }
}

// Milestone tag badge renderer
function drawMilestoneTag(ctx, x, topY, bottomY, label, color, isDashed, yOffset = 0) {
  if (x == null || isNaN(x)) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(isDashed ? [4, 3] : [4, 2]);
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x, bottomY);
  ctx.stroke();
  ctx.setLineDash([]);

  const tagText = label;
  ctx.font = "800 10px JetBrains Mono, monospace";
  const tagWidth = ctx.measureText(tagText).width + 8;
  const tagY = topY - 18 - yOffset;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - tagWidth / 2, tagY, tagWidth, 15, 3);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(tagText, x, tagY + 11.5);
}

// Unified series renderer for single and side-by-side modes
function renderCurveSeries(ctx, curve, scales, pad, h) {
  if (!curve || curve.length === 0) return;
  const { getX, getYTemp, getYRor } = scales;

  // Heat & Fan discrete control curves (stepped)
  const drawControlCurve = (key, strokeColor) => {
    const pts = [];
    curve.forEach((p) => {
      const val = p[key];
      if (val != null && val >= 0) {
        pts.push({
          x: getX(p.time_s),
          y: h - pad.bottom - (val / 100) * (h - pad.top - pad.bottom) * 0.35,
        });
      }
    });
    if (pts.length > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      drawSteppedCurve(ctx, pts);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  if (visibleChannels.heat) {
    drawControlCurve("heat", "rgba(245, 158, 11, 0.55)");
  }

  if (visibleChannels.fan) {
    drawControlCurve("fan", "rgba(168, 85, 247, 0.55)");
  }

  // ET (Catmull-Rom spline)
  if (visibleChannels.et) {
    const etPts = [];
    curve.forEach((p) => {
      if (p.et != null && p.et > 20) {
        etPts.push({ x: getX(p.time_s), y: getYTemp(p.et) });
      }
    });
    if (etPts.length > 0) {
      ctx.strokeStyle = "#00d8d6";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      drawSmoothSpline(ctx, etPts);
      ctx.stroke();
    }
  }

  // RoR (Catmull-Rom spline)
  if (visibleChannels.ror) {
    const rorPts = [];
    curve.forEach((p) => {
      if (p.ror != null && p.time_s > 20) {
        rorPts.push({ x: getX(p.time_s), y: getYRor(p.ror) });
      }
    });
    if (rorPts.length > 0) {
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      drawSmoothSpline(ctx, rorPts);
      ctx.stroke();
    }
  }

  // BT (Catmull-Rom spline)
  if (visibleChannels.bt) {
    const btPts = [];
    curve.forEach((p) => {
      if (p.bt != null) {
        btPts.push({ x: getX(p.time_s), y: getYTemp(p.bt) });
      }
    });
    if (btPts.length > 0) {
      ctx.strokeStyle = "#ff4d4f";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      drawSmoothSpline(ctx, btPts);
      ctx.stroke();
    }
  }
}

// Unified milestone renderer with vertical label staggering
function renderRoastMilestones(ctx, roast, scales, pad, h) {
  if (!roast?.milestones) return;
  const { getX } = scales;
  const m = roast.milestones;

  let staggerIdx = 0;
  const drawStaggered = (t, label, color, isDashed = true) => {
    if (t != null && t >= 0) {
      const offset = (staggerIdx % 2) * 14;
      staggerIdx++;
      drawMilestoneTag(ctx, getX(t), pad.top, h - pad.bottom, label, color, isDashed, offset);
    }
  };

  drawStaggered(0, "CH", "#94a3b8", false);
  if (m.tp_time) drawStaggered(m.tp_time, "TP", "#38bdf8");
  if (m.dry_time) drawStaggered(m.dry_time, "DRY", "#fbbf24");
  if (m.fc_time) drawStaggered(m.fc_time, "FC", "#ff4d4f");
  if (m.drop_time) drawStaggered(m.drop_time, "DROP", "#f97316");
}

// Render overlay series for superimposed compare mode
function renderOverlaySeries(ctx, curve, scales, pad, h, style) {
  if (!curve || curve.length === 0) return;
  const { getX, getYTemp, getYRor } = scales;

  // Heat & Fan control curves
  const drawControl = (key, color) => {
    const pts = [];
    curve.forEach((p) => {
      const val = p[key];
      if (val != null && val >= 0) {
        pts.push({
          x: getX(p.time_s),
          y: h - pad.bottom - (val / 100) * (h - pad.top - pad.bottom) * 0.35,
        });
      }
    });
    if (pts.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash(style.dashed ? [4, 4] : [3, 3]);
      ctx.beginPath();
      drawSteppedCurve(ctx, pts);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  if (visibleChannels.heat) drawControl("heat", style.heat);
  if (visibleChannels.fan) drawControl("fan", style.fan);

  // ET
  if (visibleChannels.et) {
    const etPts = [];
    curve.forEach((p) => {
      if (p.et != null && p.et > 20) {
        etPts.push({ x: getX(p.time_s), y: getYTemp(p.et) });
      }
    });
    if (etPts.length > 0) {
      ctx.strokeStyle = style.et;
      ctx.lineWidth = style.lineWidthOther;
      ctx.setLineDash(style.dashed ? [5, 3] : []);
      ctx.beginPath();
      drawSmoothSpline(ctx, etPts);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // RoR
  if (visibleChannels.ror) {
    const rorPts = [];
    curve.forEach((p) => {
      if (p.ror != null && p.time_s > 20) {
        rorPts.push({ x: getX(p.time_s), y: getYRor(p.ror) });
      }
    });
    if (rorPts.length > 0) {
      ctx.strokeStyle = style.ror;
      ctx.lineWidth = style.lineWidthOther;
      ctx.setLineDash(style.dashed ? [5, 3] : []);
      ctx.beginPath();
      drawSmoothSpline(ctx, rorPts);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // BT
  if (visibleChannels.bt) {
    const btPts = [];
    curve.forEach((p) => {
      if (p.bt != null) {
        btPts.push({ x: getX(p.time_s), y: getYTemp(p.bt) });
      }
    });
    if (btPts.length > 0) {
      ctx.strokeStyle = style.bt;
      ctx.lineWidth = style.lineWidthBt;
      ctx.setLineDash(style.dashed ? [6, 3] : []);
      ctx.beginPath();
      drawSmoothSpline(ctx, btPts);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// Render overlay milestones for superimposed compare mode
function renderOverlayMilestones(ctx, roast, scales, pad, h, prefix, color, baseOffset = 0) {
  if (!roast?.milestones) return;
  const { getX } = scales;
  const m = roast.milestones;

  if (m.dry_time) drawMilestoneTag(ctx, getX(m.dry_time), pad.top, h - pad.bottom, `${prefix}: DRY`, color, true, baseOffset);
  if (m.fc_time) drawMilestoneTag(ctx, getX(m.fc_time), pad.top, h - pad.bottom, `${prefix}: FC`, color, true, baseOffset);
  if (m.drop_time) drawMilestoneTag(ctx, getX(m.drop_time), pad.top, h - pad.bottom, `${prefix}: DROP`, color, true, baseOffset);
}

// Superimposed comparison chart renderer (Roast A vs Roast B on one stage)
function drawOverlayChart(roastA, roastB, canvas, tooltip) {
  if (!canvas) return;
  const setup = initCanvas(canvas);
  if (!setup) return;
  const { ctx, w, h } = setup;
  const pad = CHART_PADDING;

  ctx.clearRect(0, 0, w, h);

  const curveA = roastA?.curve || [];
  const curveB = roastB?.curve || [];

  if (curveA.length === 0 && curveB.length === 0) {
    ctx.fillStyle = "#888";
    ctx.font = "12px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Select roasts to display overlay curves", w / 2, h / 2);
    return;
  }

  const maxTimeA = curveA.length ? Math.max(...curveA.map((p) => p.time_s), roastA.phases?.total_time_s || 300) : 300;
  const maxTimeB = curveB.length ? Math.max(...curveB.map((p) => p.time_s), roastB?.phases?.total_time_s || 300) : maxTimeA;
  const maxTime = Math.max(maxTimeA, maxTimeB, 300);

  const scales = getChartScales(w, h, pad, maxTime);

  drawChartGridAndAxes(ctx, w, h, pad, maxTime, scales.getYTemp, scales.getYRor, scales.getX);

  // Render Roast A (Solid lines, Slot A Amber palette)
  if (curveA.length > 0) {
    renderOverlaySeries(ctx, curveA, scales, pad, h, {
      bt: "#d97706",
      et: "#0284c7",
      ror: "#059669",
      heat: "rgba(217, 119, 6, 0.4)",
      fan: "rgba(124, 58, 237, 0.4)",
      dashed: false,
      lineWidthBt: 2.6,
      lineWidthOther: 1.8,
    });
    renderOverlayMilestones(ctx, roastA, scales, pad, h, "A", "#d97706", 0);
  }

  // Render Roast B (Dashed lines, Slot B Rose/Cyan palette)
  if (curveB.length > 0) {
    renderOverlaySeries(ctx, curveB, scales, pad, h, {
      bt: "#e11d48",
      et: "#0891b2",
      ror: "#65a30d",
      heat: "rgba(225, 29, 72, 0.4)",
      fan: "rgba(147, 51, 234, 0.4)",
      dashed: true,
      lineWidthBt: 2.4,
      lineWidthOther: 1.6,
    });
    renderOverlayMilestones(ctx, roastB, scales, pad, h, "B", "#e11d48", 16);
  }

  // Hover and touch scrubbing on superimposed overlay
  if (tooltip) {
    const handleOverlayScrub = (mouseX) => {
      if (mouseX < pad.left || mouseX > w - pad.right) {
        tooltip.classList.add("hidden");
        drawOverlayChart(roastA, roastB, canvas, null);
        return;
      }

      drawOverlayChart(roastA, roastB, canvas, null);
      const t = ((mouseX - pad.left) / (w - pad.left - pad.right)) * maxTime;
      const closestA = curveA.length ? findClosestPoint(curveA, t) : null;
      const closestB = curveB.length ? findClosestPoint(curveB, t) : null;

      if (!closestA && !closestB) return;

      const cursorX = mouseX;
      ctx.strokeStyle = document.body.classList.contains("dark-theme") ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cursorX, pad.top);
      ctx.lineTo(cursorX, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      if (closestA && visibleChannels.bt && closestA.bt != null) {
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(cursorX, scales.getYTemp(closestA.bt), 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (closestB && visibleChannels.bt && closestB.bt != null) {
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(cursorX, scales.getYTemp(closestB.bt), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      tooltip.classList.remove("hidden");
      tooltip.style.left = `${Math.min(w - 220, Math.max(10, mouseX + 12))}px`;
      tooltip.style.top = "10px";

      const timeLabel = formatTime(Math.round(t));
      const btA = closestA?.bt != null ? `${closestA.bt.toFixed(1)}°C` : "-";
      const btB = closestB?.bt != null ? `${closestB.bt.toFixed(1)}°C` : "-";
      const rorA = closestA?.ror != null ? `${closestA.ror.toFixed(1)}` : "-";
      const rorB = closestB?.ror != null ? `${closestB.ror.toFixed(1)}` : "-";

      let deltaBtHtml = "";
      if (closestA?.bt != null && closestB?.bt != null) {
        const d = (closestB.bt - closestA.bt).toFixed(1);
        const sign = d >= 0 ? `+${d}` : `${d}`;
        deltaBtHtml = `<div class="scrub-tooltip-row" style="color: var(--text-title); font-weight: 700; border-top: 1px solid var(--border-subtle); margin-top: 4px; padding-top: 4px;">Δ BT (B-A): ${sign}°C</div>`;
      }

      tooltip.innerHTML = `
        <div class="scrub-tooltip-time">${timeLabel} <span class="scrub-tooltip-seconds">(${Math.round(t)}s)</span></div>
        <div class="scrub-tooltip-row" style="color: #d97706; font-weight: 700;">A: BT ${btA} • RoR ${rorA}</div>
        <div class="scrub-tooltip-row" style="color: #e11d48; font-weight: 700;">B: BT ${btB} • RoR ${rorB}</div>
        ${deltaBtHtml}
      `;
    };

    canvas.onmousemove = (e) => handleOverlayScrub(e.offsetX);
    canvas.onmouseleave = () => {
      tooltip.classList.add("hidden");
      drawOverlayChart(roastA, roastB, canvas, null);
    };

    const handleTouch = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      handleOverlayScrub(e.touches[0].clientX - rect.left);
    };
    canvas.ontouchstart = handleTouch;
    canvas.ontouchmove = handleTouch;
    canvas.ontouchend = () => {
      tooltip.classList.add("hidden");
      drawOverlayChart(roastA, roastB, canvas, null);
    };
    canvas.ontouchcancel = () => {
      tooltip.classList.add("hidden");
      drawOverlayChart(roastA, roastB, canvas, null);
    };
  }
}

// Base chart renderer for roast curves
function drawChartBase(roast, canvas) {
  const setup = initCanvas(canvas);
  if (!setup) return null;
  const { ctx, w, h } = setup;
  const pad = CHART_PADDING;

  ctx.clearRect(0, 0, w, h);

  const curve = roast?.curve || [];
  if (curve.length === 0) {
    ctx.fillStyle = "#888";
    ctx.font = "12px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("No curve data", w / 2, h / 2);
    return null;
  }

  const maxTime = Math.max(...curve.map((p) => p.time_s), roast.phases?.total_time_s || 300);
  const scales = getChartScales(w, h, pad, maxTime);

  drawChartGridAndAxes(ctx, w, h, pad, maxTime, scales.getYTemp, scales.getYRor, scales.getX);
  renderCurveSeries(ctx, curve, scales, pad, h);
  renderRoastMilestones(ctx, roast, scales, pad, h);

  return { ctx, w, h, pad, maxTime, scales, curve };
}

// Schedule requestAnimationFrame scrub render
function scheduleHoverScrub(type, payload) {
  pendingScrubState = { type, payload };
  if (!isScrubberFramePending) {
    isScrubberFramePending = true;
    requestAnimationFrame(renderPendingHoverScrub);
  }
}

// Render single hover scrub frame
function renderSingleScrubFrame({ roast, canvas, tooltip, mouseX }) {
  const base = drawChartBase(roast, canvas);
  if (!base) return;
  const { ctx, w, h, pad, maxTime, scales, curve } = base;

  if (mouseX < pad.left || mouseX > w - pad.right) {
    if (tooltip) tooltip.classList.add("hidden");
    return;
  }

  const t = ((mouseX - pad.left) / (w - pad.left - pad.right)) * maxTime;
  const closest = findClosestPoint(curve, t);

  if (closest && tooltip) {
    const cursorX = scales.getX(closest.time_s);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cursorX, pad.top);
    ctx.lineTo(cursorX, h - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    if (visibleChannels.bt && closest.bt != null) {
      ctx.fillStyle = "#ff4d4f";
      ctx.beginPath();
      ctx.arc(cursorX, scales.getYTemp(closest.bt), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    tooltip.classList.remove("hidden");
    tooltip.style.left = `${Math.min(w - 180, Math.max(10, mouseX + 10))}px`;
    tooltip.style.top = "8px";
    tooltip.innerHTML = renderScrubTooltipHtml(closest, visibleChannels);
  }
}

// Render synchronized side-by-side scrub frame
function renderSideBySideScrubFrame({ time_s }) {
  // Update Canvas A
  if (compareRoastA && cmpCanvasA) {
    const baseA = drawChartBase(compareRoastA, cmpCanvasA);
    if (baseA) {
      const { ctx: ctxA, w: wA, h: hA, pad: padA, scales: scalesA, curve: curveA } = baseA;
      const closestA = findClosestPoint(curveA, time_s);

      if (closestA) {
        const cursorXA = scalesA.getX(closestA.time_s);
        ctxA.strokeStyle = "#ffffff";
        ctxA.lineWidth = 1;
        ctxA.setLineDash([2, 2]);
        ctxA.beginPath();
        ctxA.moveTo(cursorXA, padA.top);
        ctxA.lineTo(cursorXA, hA - padA.bottom);
        ctxA.stroke();
        ctxA.setLineDash([]);

        if (visibleChannels.bt && closestA.bt != null) {
          ctxA.fillStyle = "#ff4d4f";
          ctxA.beginPath();
          ctxA.arc(cursorXA, scalesA.getYTemp(closestA.bt), 4, 0, Math.PI * 2);
          ctxA.fill();
        }

        if (cmpTooltipA) {
          cmpTooltipA.classList.remove("hidden");
          cmpTooltipA.style.left = `${Math.min(wA - 180, Math.max(10, cursorXA + 10))}px`;
          cmpTooltipA.style.top = "8px";
          cmpTooltipA.innerHTML = renderScrubTooltipHtml(closestA, visibleChannels);
        }
      }
    }
  }

  // Update Canvas B
  if (compareRoastB && cmpCanvasB) {
    const baseB = drawChartBase(compareRoastB, cmpCanvasB);
    if (baseB) {
      const { ctx: ctxB, w: wB, h: hB, pad: padB, scales: scalesB, curve: curveB } = baseB;
      const closestB = findClosestPoint(curveB, time_s);

      if (closestB) {
        const cursorXB = scalesB.getX(closestB.time_s);
        ctxB.strokeStyle = "#ffffff";
        ctxB.lineWidth = 1;
        ctxB.setLineDash([2, 2]);
        ctxB.beginPath();
        ctxB.moveTo(cursorXB, padB.top);
        ctxB.lineTo(cursorXB, hB - padB.bottom);
        ctxB.stroke();
        ctxB.setLineDash([]);

        if (visibleChannels.bt && closestB.bt != null) {
          ctxB.fillStyle = "#ff4d4f";
          ctxB.beginPath();
          ctxB.arc(cursorXB, scalesB.getYTemp(closestB.bt), 4, 0, Math.PI * 2);
          ctxB.fill();
        }

        if (cmpTooltipB) {
          cmpTooltipB.classList.remove("hidden");
          cmpTooltipB.style.left = `${Math.min(wB - 180, Math.max(10, cursorXB + 10))}px`;
          cmpTooltipB.style.top = "8px";
          cmpTooltipB.innerHTML = renderScrubTooltipHtml(closestB, visibleChannels);
        }
      }
    }
  }
}

// Render the enqueued scrub state
function renderPendingHoverScrub() {
  isScrubberFramePending = false;
  if (!pendingScrubState) return;

  const { type, payload } = pendingScrubState;
  pendingScrubState = null;

  if (type === "single") {
    renderSingleScrubFrame(payload);
  } else if (type === "side-by-side") {
    renderSideBySideScrubFrame(payload);
  }
}

// Chart rendering engine for single views and individual side-by-side columns
function drawChart(roast, canvas, tooltip, enableHover = true) {
  if (!canvas) return;
  drawChartBase(roast, canvas);

  if (enableHover && tooltip) {
    canvas.onmousemove = (e) => {
      scheduleHoverScrub("single", { roast, canvas, tooltip, mouseX: e.offsetX });
    };

    canvas.onmouseleave = () => {
      tooltip.classList.add("hidden");
      drawChartBase(roast, canvas);
    };

    const handleTouchScrub = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      scheduleHoverScrub("single", { roast, canvas, tooltip, mouseX: touchX });
    };

    canvas.ontouchstart = handleTouchScrub;
    canvas.ontouchmove = handleTouchScrub;
    canvas.ontouchend = () => {
      tooltip.classList.add("hidden");
      drawChartBase(roast, canvas);
    };
    canvas.ontouchcancel = () => {
      tooltip.classList.add("hidden");
      drawChartBase(roast, canvas);
    };
  }
}

// Clear crosshairs and tooltips on side-by-side leave
function clearSideBySideHover() {
  if (compareRoastA && cmpCanvasA) {
    drawChartBase(compareRoastA, cmpCanvasA);
    if (cmpTooltipA) cmpTooltipA.classList.add("hidden");
  }
  if (compareRoastB && cmpCanvasB) {
    drawChartBase(compareRoastB, cmpCanvasB);
    if (cmpTooltipB) cmpTooltipB.classList.add("hidden");
  }
}

// Attach synchronized hover scrubbing listeners to side-by-side canvases
function setupSideBySideScrubbing() {
  const attachScrub = (canvas, roast) => {
    if (!canvas) return;
    const computeScrubAtX = (mouseX) => {
      if (!roast || !roast.curve || roast.curve.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const pad = { top: 24, right: 40, bottom: 28, left: 45 };
      if (mouseX < pad.left || mouseX > rect.width - pad.right) {
        clearSideBySideHover();
        return;
      }
      const maxTime = Math.max(...roast.curve.map((p) => p.time_s), roast.phases?.total_time_s || 300);
      const t = ((mouseX - pad.left) / (rect.width - pad.left - pad.right)) * maxTime;
      scheduleHoverScrub("side-by-side", { time_s: t });
    };

    canvas.onmousemove = (e) => computeScrubAtX(e.offsetX);
    canvas.onmouseleave = clearSideBySideHover;

    canvas.ontouchstart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      computeScrubAtX(e.touches[0].clientX - rect.left);
    };
    canvas.ontouchmove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      computeScrubAtX(e.touches[0].clientX - rect.left);
    };
    canvas.ontouchend = clearSideBySideHover;
    canvas.ontouchcancel = clearSideBySideHover;
  };

  attachScrub(cmpCanvasA, compareRoastA);
  attachScrub(cmpCanvasB, compareRoastB);
}

// Start
document.addEventListener("DOMContentLoaded", init);
