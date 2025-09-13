const DATA_URL = "data/multimedia.json";

const $ = NSN.utils.$;
const $$ = NSN.utils.$$;
const toDate = (s) => new Date(s);
const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => NSN.utils.escapeHTML(s);

/******** Personalization header ********/
function paintHeaderProfile() {
  const nm = sessionStorage.getItem("nsn_name") || "";
  const tp = sessionStorage.getItem("nsn_type") || "";
  const helloEl = $("#helloUser");
  const activeEl = $("#activeProfile");
  if (helloEl)
    helloEl.textContent =
      nm || tp
        ? `Hi ${nm ? nm : ""}${nm && tp ? " • " : ""}${
            tp ? tp[0].toUpperCase() + tp.slice(1) : ""
          }`
        : "";
  if (activeEl) activeEl.textContent = tp ? `Tailored for: ${tp}` : "";

  // Prefill the filter to match user type once (init() will read value into state)
  const sel = $("#userTypeFilter");
  if (tp && sel && !sel.value) sel.value = tp;
}

/******** Data & State ********/
let ITEMS = []; // normalized items from multimedia.json
const state = {
  q: "",
  ut: "",
  cat: "",
  fmt: "",
  sort: "newest",
  page: 1,
  perPage: 9,
};

/******** Normalize JSON to avoid filter mismatches ********/
function normalizeItems(rows) {
  return (rows || []).map((it) => {
    const norm = {
      ...it,
      userType: (it.userType || "").toLowerCase().trim(),
      category: (it.category || "").toLowerCase().trim(),
      format: (it.format || "").toLowerCase().trim(),
      date: it.date || "2000-01-01",
    };
    if (!norm.id) norm.id = `auto-${Math.random().toString(36).slice(2)}`; // Ensure item has an id
    return norm;
  });
}

/******** Card renderer ********/
function itemCard(item) {
  const bmActive = NSN.isBookmarked(item.id) ? "bookmark-active" : "";
  const tags = (item.tags || [])
    .map((t) => `<span class="chip"><i class="bi bi-tag"></i> ${esc(t)}</span>`)
    .join(" ");

  const media =
    item.format === "video" && item.youtubeId
      ? `<div class="thumb"><iframe loading="lazy" title="${esc(item.title)}"
         src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
           item.youtubeId
         )}"
         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
         referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
      : item.format === "podcast" && item.audioUrl
      ? `<audio controls class="w-100" preload="none" src="${esc(
          item.audioUrl
        )}"></audio>`
      : `<div class="thumb d-flex align-items-center justify-content-center text-muted">No media</div>`;

  return `
    <div class="col-12 col-md-6 col-xl-4">
      <article class="feature-card p-3 h-100 d-flex flex-column">
        <div class="d-flex align-items-start justify-content-between mb-2">
          <div class="icon-pill"><i class="bi ${
            item.icon || "bi-camera-reels"
          }"></i></div>
          <button class="btn btn-light btn-sm border-0 ${bmActive}" title="Bookmark"
                  data-bm="${item.id}" data-label="${esc(item.title)}"
                  data-href="${
                    item.format === "video" && item.youtubeId
                      ? `https://www.youtube.com/watch?v=${encodeURIComponent(
                          item.youtubeId
                        )}`
                      : item.audioUrl || "#"
                  }">
            <i class="bi bi-heart-fill"></i>
          </button>
        </div>
        <h6 class="mb-1">${esc(item.title)}</h6>
        <div class="meta mb-2">
          <i class="bi bi-person-video3 me-1"></i>${esc(item.speaker || "—")}
          · <i class="bi bi-collection-play me-1"></i>${capitalize(
            item.category
          )}
          · <i class="bi bi-people me-1"></i>${capitalize(item.userType)}
          · <i class="bi bi-calendar-event me-1"></i>${new Date(
            item.date
          ).toLocaleDateString()}
        </div>
        ${media}
        <p class="small muted mt-2 mb-2">${esc(item.description || "")}</p>
        <div class="d-flex flex-wrap gap-1 mb-2">${tags}</div>

        <div class="mt-auto">
          <div class="d-flex flex-wrap gap-2">
            ${
              item.format === "video" && item.youtubeId
                ? `<a class="btn btn-outline-primary btn-sm" target="_blank" rel="noreferrer" href="https://www.youtube.com/watch?v=${encodeURIComponent(
                    item.youtubeId
                  )}"><i class="bi bi-box-arrow-up-right me-1"></i> Open on YouTube</a>`
                : ""
            }
            ${
              item.format === "podcast" && item.audioUrl
                ? `<a class="btn btn-outline-primary btn-sm" target="_blank" rel="noreferrer" href="${esc(
                    item.audioUrl
                  )}"><i class="bi bi-box-arrow-up-right me-1"></i> Open audio</a>`
                : ""
            }
            ${
              item.transcript
                ? `<button class="btn btn-light btn-sm" data-tx="${item.id}"><i class="bi bi-text-paragraph me-1"></i> Transcript</button>`
                : ""
            }
          </div>
          <div class="mt-2 transcript hidden" id="tx-${item.id}">${esc(
    item.transcript || ""
  )}</div>
        </div>
      </article>
    </div>`;
}

/******** Filtering, sorting, paging ********/
function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let rows = ITEMS.filter((it) => {
    const text = `${it.title || ""} ${it.speaker || ""} ${(it.tags || []).join(
      " "
    )} ${it.description || ""}`.toLowerCase();
    const matchesQ = !q || text.includes(q);
    const matchesUT = !state.ut || it.userType === state.ut;
    const matchesCat = !state.cat || it.category === state.cat;
    const matchesFmt = !state.fmt || it.format === state.fmt;
    return matchesQ && matchesUT && matchesCat && matchesFmt;
  });

  rows.sort((a, b) => {
    switch (state.sort) {
      case "newest":
        return toDate(b.date) - toDate(a.date);
      case "oldest":
        return toDate(a.date) - toDate(b.date);
      case "az":
        return (a.title || "").localeCompare(b.title || "");
      case "za":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return 0;
    }
  });

  return rows;
}

function paginate(rows) {
  const start = (state.page - 1) * state.perPage;
  const end = start + state.perPage;
  const totalPages = Math.max(1, Math.ceil(rows.length / state.perPage));
  return { slice: rows.slice(start, end), total: rows.length, totalPages };
}

/******** Render ********/
function render() {
  const all = applyFilters();
  const { slice, total, totalPages } = paginate(all);

  const resultCountEl = $("#resultCount");
  if (resultCountEl) {
    resultCountEl.textContent =
      total === 0
        ? "No items match your filters"
        : `${total} item${total !== 1 ? "s" : ""}`;
  }

  const pageInfoEl = $("#pageInfo");
  if (pageInfoEl)
    pageInfoEl.textContent = `Page ${state.page} of ${totalPages}`;

  $("#skeleton")?.classList.add("hidden");

  const grid = $("#grid");
  if (grid) {
    grid.classList.remove("hidden");
    grid.innerHTML = slice.length
      ? slice.map(itemCard).join("")
      : `<div class="col-12"><div class="alert alert-warning mb-0">
           No results. Try clearing filters or check that <code>data/multimedia.json</code> is reachable.
         </div></div>`;
  }

  // Bind bookmark & transcript toggles
  $$("[data-bm]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const entry = {
        id: btn.getAttribute("data-bm"),
        label: btn.getAttribute("data-label") || "Item",
        href: btn.getAttribute("data-href") || "#",
      };
      NSN.toggleBookmark(entry, "#bookmarkList");
      $$(`[data-bm="${entry.id}"]`).forEach((b) =>
        b.classList.toggle("bookmark-active")
      );
    });
  });
  $$("[data-tx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-tx");
      const el = $(`#tx-${CSS.escape(id)}`);
      if (el) {
        el.classList.toggle("hidden");
      }
    });
  });

  // Pager buttons
  const prev = $("#prevPage"),
    next = $("#nextPage");
  if (prev) prev.disabled = state.page <= 1;
  if (next) next.disabled = state.page >= totalPages;

  // Debug counts
  console.log(
    "Render → total:",
    total,
    "page:",
    state.page,
    "slice:",
    slice.length,
    "filters:",
    { ...state }
  );
}

/******** UI wiring ********/
function wire() {
  $("#search")?.addEventListener("input", (e) => {
    state.q = e.target.value;
    state.page = 1;
    render();
  });
  $("#userTypeFilter")?.addEventListener("change", (e) => {
    state.ut = e.target.value;
    state.page = 1;
    render();
  });
  $("#categoryFilter")?.addEventListener("change", (e) => {
    state.cat = e.target.value;
    state.page = 1;
    render();
  });
  $("#formatFilter")?.addEventListener("change", (e) => {
    state.fmt = e.target.value;
    state.page = 1;
    render();
  });
  $("#sortBy")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  $("#perPage")?.addEventListener("change", (e) => {
    state.perPage = Number(e.target.value) || 9;
    state.page = 1;
    render();
  });

  $("#prevPage")?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });
  $("#nextPage")?.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  $("#btnClear")?.addEventListener("click", () => {
    state.q = "";
    state.ut = "";
    state.cat = "";
    state.fmt = "";
    state.sort = "newest";
    state.page = 1;
    state.perPage = 9;
    if ($("#search")) $("#search").value = "";
    if ($("#userTypeFilter")) $("#userTypeFilter").value = "";
    if ($("#categoryFilter")) $("#categoryFilter").value = "";
    if ($("#formatFilter")) $("#formatFilter").value = "";
    if ($("#sortBy")) $("#sortBy").value = "newest";
    if ($("#perPage")) $("#perPage").value = "9";
    render();
  });

  // Shared sidebar actions
  $("#exportBookmarks")?.addEventListener("click", () =>
    NSN.exportBookmarks("Bookmarks.txt")
  );
  $("#clearBookmarks")?.addEventListener("click", () =>
    NSN.clearBookmarks("#bookmarkList")
  );
}

/******** Init ********/
async function init() {
  NSN.utils.setYear("#year");
  paintHeaderProfile();

  // Shared sidebars
  NSN.getRecent(); // sanitize any old/bad data
  NSN.paintRecent("#recentList");
  NSN.paintBookmarks("#bookmarkList");

  try {
    const raw = await NSN.loadJSON(DATA_URL, {
      fallback: [],
      onErrorMessageSelector: "#resultCount",
    });
    ITEMS = normalizeItems(Array.isArray(raw) ? raw : []);
  } catch (err) {
    console.error(err);
    alert(
      err.message ||
        `Failed to load ${DATA_URL}. Make sure you’re running a local server.`
    );
    return;
  }

  // Align JS state with currently visible filter selects before first render
  state.ut = $("#userTypeFilter")?.value || "";
  state.cat = $("#categoryFilter")?.value || "";
  state.fmt = $("#formatFilter")?.value || "";
  state.perPage = Number($("#perPage")?.value) || 9;
  state.sort = $("#sortBy")?.value || "newest";

  wire();
  render();

  // If nothing shows on first render, auto-clear filters once to unstick accidental prefill
  if (!applyFilters().length) {
    console.warn("No results after first render; auto-clearing filters once.");
    $("#btnClear")?.click();
  }

  NSN.pushRecent("Opened Multimedia", "multimedia.html", "#recentList");

  // Quick diagnostics bubble (auto-removes)
  (async function diagnostics() {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;bottom:12px;left:12px;z-index:9999;background:#111;color:#fff;padding:8px 12px;border-radius:8px;font:12px/1.4 system-ui;opacity:.9";
    el.textContent = "Diagnostics: running…";
    document.body.appendChild(el);
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      el.textContent = `Diagnostics: ${res.ok ? "OK" : "FAIL"} (status ${
        res.status
      })`;
      const text = await res.text();
      console.log("[diagnostics] raw multimedia.json:", text);
      try {
        const json = JSON.parse(text);
        el.textContent += ` • parsed ${
          Array.isArray(json) ? json.length : "n/a"
        } items`;
      } catch (e) {
        el.textContent += " • JSON parse error (see console)";
        console.error("[diagnostics] JSON parse error:", e);
      }
    } catch (e) {
      el.textContent = "Diagnostics: fetch threw (see console)";
      console.error("[diagnostics] fetch error:", e);
    }
    setTimeout(() => el.remove(), 6000);
  })();
}

// Animations

(function(){
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

  /* Sticky navbar shadow */
  const nav = $('.navbar');
  const onScroll = () => nav && (window.scrollY > 4 ? nav.classList.add('is-stuck') : nav.classList.remove('is-stuck'));
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* Reveal on view (matches Admissions timing) */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold: .12});
  $$('.reveal').forEach(el=>io.observe(el));

  /* Ripple */
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('.ripple');
    if(!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--rx', (e.clientX - r.left) + 'px');
    b.style.setProperty('--ry', (e.clientY - r.top) + 'px');
    b.classList.remove('ripple--animating');
    // force reflow
    void b.offsetWidth;
    b.classList.add('ripple--animating');
    setTimeout(()=>b.classList.remove('ripple--animating'), 650);
  });

  /* Sparkles populate (same look as Admissions) */
  const spark = $('.sparkles');
  if(spark){
    const N = Math.min(28, Math.max(18, Math.floor(window.innerWidth/40)));
    for(let i=0;i<N;i++){
      const dot = document.createElement('i');
      dot.style.left = Math.random()*100 + '%';
      dot.style.top  = Math.random()*100 + '%';
      dot.style.animationDuration = (6 + Math.random()*6) + 's';
      dot.style.opacity = (0.5 + Math.random()*0.5);
      spark.appendChild(dot);
    }
  }

  /* Breadcrumb stagger (optional nicety) */
  $$('.breadcrumb li').forEach((li, idx)=>{
    li.style.opacity = '0';
    li.style.transform = 'translateY(6px)';
    li.style.animation = `crumbIn .45s ease ${.05 + idx*0.07}s forwards`;
  });

})();


(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ---- Scroll reveal ---- */
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target;
          const delay = parseFloat(el.dataset.delay || 0);
          setTimeout(() => el.classList.add("in"), delay * 1000);
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el, i) => {
    if (!el.dataset.delay) el.dataset.delay = (i % 6) * 0.06;
    io.observe(el);
  });

  /* ---- Button ripple ---- */
  function makeRipple(e) {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left,
      y = e.clientY - r.top;
    btn.style.setProperty("--rx", x - r.width / 2 + "px");
    btn.style.setProperty("--ry", y - r.height / 2 + "px");
    btn.classList.remove("ripple--animating");
    void btn.offsetWidth; // restart
    btn.classList.add("ripple--animating");
    setTimeout(() => btn.classList.remove("ripple--animating"), 650);
  }
  $$(".ripple").forEach((b) => b.addEventListener("click", makeRipple));

  /* ---- When multimedia.js injects cards into #grid, animate them ---- */
  const grid = $("#grid");
  if (grid) {
    const mo = new MutationObserver(() => {
      // Add reveal to each feature-card or column
      $$(".col-12, .col-md-6, .col-lg-4, .feature-card", grid).forEach(
        (n, i) => {
          if (!n.classList.contains("reveal")) {
            n.classList.add("reveal");
            n.dataset.delay = (i % 8) * 0.05;
            io.observe(n);
          }
        }
      );
      // Smooth in for any iframes that load later
      $$("iframe", grid).forEach((f) => {
        if (!f.dataset._nsn_ready) {
          f.addEventListener(
            "load",
            () => {
              f.classList.add("is-ready");
            },
            { once: true }
          );
          f.dataset._nsn_ready = "1";
        }
      });
      // Animate bookmark icons if your JS toggles classes
      $$(".bookmark-toggle", grid).forEach((btn) => {
        if (!btn.dataset._nsn_bm) {
          btn.addEventListener(
            "click",
            () => {
              btn.animate(
                [
                  { transform: "scale(1)" },
                  { transform: "scale(1.2)" },
                  { transform: "scale(1)" },
                ],
                { duration: 220, easing: "ease-out" }
              );
            },
            { passive: true }
          );
          btn.dataset._nsn_bm = "1";
        }
      });
    });
    mo.observe(grid, { childList: true, subtree: true });
  }

  /* ---- Graceful show of results after skeleton hidden by your script ---- */
  const skel = $("#skeleton");
  const showGrid = new MutationObserver(() => {
    if (grid && !grid.classList.contains("hidden")) {
      grid.classList.add("reveal");
      io.observe(grid);
      showGrid.disconnect();
    }
  });
  if (grid)
    showGrid.observe(grid, { attributes: true, attributeFilter: ["class"] });
})();

document.addEventListener("DOMContentLoaded", init);
