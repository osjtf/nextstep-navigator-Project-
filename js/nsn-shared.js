(function (global) {
  "use strict";

  /** ---------- Tiny DOM helpers ---------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  /** ---------- Keys ---------- */
  const KEYS = {
    RECENT: "nsn_recent",
    BOOKMARKS: "nsn_bookmarks",
  };

  /** ---------- Small utilities ---------- */
  const utils = {
    $,
    $$,
    toDate: (s) => new Date(s),
    capitalize: (s = "") => s.charAt(0).toUpperCase() + s.slice(1),
    escapeHTML: (str = "") =>
      str.replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[m])
      ),
    setYear: (selector = "#year") => {
      const el = $(selector);
      if (el) el.textContent = new Date().getFullYear();
    },
  };

  /** ---------- Header personalization ---------- */

  function paintHeaderProfile(
    helloSel = "#helloUser",
    activeSel = "#activeProfile",
    prefillUserTypeSel = "#userTypeFilter"
  ) {
    const nm = sessionStorage.getItem("nsn_name") || "";
    const tp = sessionStorage.getItem("nsn_type") || "";

    const helloEl = $(helloSel);
    const activeEl = $(activeSel);

    if (helloEl) {
      helloEl.textContent =
        nm || tp
          ? `Hi ${nm ? nm : ""}${nm && tp ? " • " : ""}${
              tp ? tp[0].toUpperCase() + tp.slice(1) : ""
            }`
          : "";
    }

    if (activeEl) {
      activeEl.textContent = tp ? `Tailored for: ${tp}` : "";
    }

    // Optional: prefill a user-type filter once
    const sel = $(prefillUserTypeSel);
    if (tp && sel && !sel.value) sel.value = tp;
  }

  /** ---------- Recently Viewed (safe) ---------- */
  function readRecentRaw() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.RECENT) || "[]");
    } catch {
      return [];
    }
  }

  function sanitizeRecentList(list) {
    const clean = [];
    const seen = new Set();
    for (const item of Array.isArray(list) ? list : []) {
      const label =
        item && typeof item.label === "string" ? item.label.trim() : "";
      const href =
        item && typeof item.href === "string" ? item.href.trim() : "#";
      if (!label) continue; // skip bad/empty
      const key = `${label}::${href}`;
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push({ label, href, ts: Number(item?.ts) || Date.now() });
    }
    return clean.slice(0, 8); // cap to 8
  }

  /**
   * Returns sanitized, capped recent list and rewrites storage.
   */
  function getRecent() {
    const sanitized = sanitizeRecentList(readRecentRaw());
    localStorage.setItem(KEYS.RECENT, JSON.stringify(sanitized));
    return sanitized;
  }

  /**
   * Safe writer: adds an item if it has a label; de-duplicates by label+href.
   * Optionally repaints the UI list at listSel.
   */
  function pushRecent(label, href = "#", listSel = "#recentList") {
    const name = typeof label === "string" ? label.trim() : "";
    const link = typeof href === "string" ? href.trim() : "#";
    if (!name) return;

    const list = getRecent().filter(
      (x) => !(x.label === name && x.href === link)
    );
    list.unshift({ label: name, href: link, ts: Date.now() });
    localStorage.setItem(KEYS.RECENT, JSON.stringify(list.slice(0, 8)));
    paintRecent(listSel);
  }

  /**
   * Paints the recent list into the given selector.
   */
  function paintRecent(listSel = "#recentList") {
    const el = $(listSel);
    if (!el) return;
    const arr = getRecent();
    el.innerHTML = arr.length
      ? arr
          .map(
            (x) =>
              `<li><a href="${x.href || "#"}">${utils.escapeHTML(
                x.label || "(untitled)"
              )}</a></li>`
          )
          .join("")
      : '<li class="text-muted">Nothing yet.</li>';
  }

  /** ---------- Bookmarks (shared) ---------- */
  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || "[]");
    } catch {
      return [];
    }
  }

  function isBookmarked(id) {
    return getBookmarks().some((x) => x.id === id);
  }

  /**
   * Adds/removes a bookmark entry: { id, href?, label? }
   * Repaints the list UI if listSel is provided.
   */
  function toggleBookmark(entry, listSel = "#bookmarkList") {
    if (!entry || !entry.id) return;
    const list = getBookmarks();
    const idx = list.findIndex((x) => x.id === entry.id);
    if (idx >= 0) list.splice(idx, 1); // remove
    else
      list.unshift({
        // add
        id: entry.id,
        href: entry.href || "#",
        label: entry.label || "Untitled",
      });
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list.slice(0, 200))); // cap to 200
    paintBookmarks(listSel);
  }

  function paintBookmarks(listSel = "#bookmarkList") {
    const el = $(listSel);
    if (!el) return;
    const list = getBookmarks();
    el.innerHTML = list.length
      ? list
          .map(
            (x) =>
              `<li><i class="bi bi-heart text-danger me-1"></i>${utils.escapeHTML(
                x.label
              )}</li>`
          )
          .join("")
      : '<li class="text-muted">No bookmarks yet.</li>';
  }

  function exportBookmarks(filename = "Bookmarks.txt") {
    const list = getBookmarks();
    if (!list.length) {
      alert("No bookmarks to export.");
      return;
    }
    const lines = list.map(
      (x, i) => `${i + 1}. ${x.label}${x.href ? ` — ${x.href}` : ""}`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearBookmarks(listSel = "#bookmarkList") {
    localStorage.removeItem(KEYS.BOOKMARKS);
    paintBookmarks(listSel);
  }

  /** ---------- JSON loader (with friendly error + fallback) ---------- */
  /**
   * loadJSON(url, { fallback, onErrorMessageSelector })
   * - Returns parsed JSON or the provided fallback (default null).
   * - Writes a friendly message to onErrorMessageSelector on failure.
   * - Uses { cache: 'no-store' } to avoid stale assets in dev.
   */
  async function loadJSON(
    url,
    { fallback = null, onErrorMessageSelector = "#resultCount" } = {}
  ) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      const out = $(onErrorMessageSelector);
      if (out)
        out.textContent = `Could not load ${url}. ${e.message}. Are you serving over http(s), not file:// ?`;
      console.error(`Failed to load ${url}`, e);
      return fallback ?? null;
    }
  }

  /** ---------- Public API ---------- */
  const NSN = {
    KEYS,
    utils,
    // personalization
    paintHeaderProfile,
    // recent
    getRecent,
    pushRecent,
    paintRecent,
    // bookmarks
    getBookmarks,
    isBookmarked,
    toggleBookmark,
    paintBookmarks,
    exportBookmarks,
    clearBookmarks,
    // data
    loadJSON,
  };

  // Attach to window
  global.NSN = NSN;
})(window);
