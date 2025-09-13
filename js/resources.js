(function () {
  "use strict";

  /* ------------------ Utilities ------------------ */
  const SEL = {
    year: "#year",
    year2: "#year2",
    search: "#search",
    ut: "#userTypeFilter",
    cat: "#categoryFilter",
    typ: "#typeFilter",
    sort: "#sortBy",
    per: "#perPage",
    clear: "#btnClear",
    grid: "#grid",
    skeleton: "#skeleton",
    result: "#resultCount",
    pageInfo: "#pageInfo",
    prev: "#prevPage",
    next: "#nextPage",
    recent: "#recentList",
    bmlist: "#bookmarkList",
    bmExport: "#exportBookmarks",
    bmClear: "#clearBookmarks",
    hello: "#helloUser",
    active: "#activeProfile",
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s = "") =>
    s.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  const show = (el) => {
    if (!el) return;
    el.classList.remove("hidden");
    el.style.display = "";
  };
  const hide = (el) => {
    if (!el) return;
    el.classList.add("hidden");
    el.style.display = "none";
  };
  const toDate = (s) => new Date(s);

  const KEYS = { RECENT: "nsn_recent", BOOKMARKS: "nsn_bookmarks" };
  const getRecent = () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.RECENT) || "[]");
    } catch {
      return [];
    }
  };
  const pushRecent = (label, href) => {
    const list = getRecent().filter(
      (x) => !(x.label === label && x.href === href)
    );
    list.unshift({ label, href, ts: Date.now() });
    localStorage.setItem(KEYS.RECENT, JSON.stringify(list.slice(0, 8)));
    paintRecent();
  };
  const paintRecent = () => {
    const el = $(SEL.recent);
    if (!el) return;
    const list = getRecent();
    el.innerHTML = list.length
      ? list
          .map(
            (x) =>
              `<li><a href="${x.href || "#"}">${esc(
                x.label || "(untitled)"
              )}</a></li>`
          )
          .join("")
      : '<li class="text-muted">Nothing yet.</li>';
  };

  const getBM = () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || "[]");
    } catch {
      return [];
    }
  };
  const isBM = (id) => getBM().some((x) => x.id === id);
  const toggleBM = (entry) => {
    const list = getBM();
    const i = list.findIndex((x) => x.id === entry.id);
    if (i >= 0) list.splice(i, 1);
    else list.unshift(entry);
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list.slice(0, 200)));
    paintBM();
  };
  const paintBM = () => {
    const el = $(SEL.bmlist);
    if (!el) return;
    const list = getBM();
    el.innerHTML = list.length
      ? list
          .map(
            (x) =>
              `<li><i class="bi bi-heart text-danger me-1"></i>${esc(
                x.label
              )}</li>`
          )
          .join("")
      : '<li class="text-muted">No bookmarks yet.</li>';
  };

  /* ------------------ Personalization (NEW) ------------------ */
  function paintHeaderProfile() {
    const nm = (sessionStorage.getItem("nsn_name") || "").trim();
    const tp = (sessionStorage.getItem("nsn_type") || "").trim().toLowerCase();

    const helloEl = $(SEL.hello);
    const activeEl = $(SEL.active);
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

    // Prefill userType filter ONCE (only if empty in the UI)
    const sel = $(SEL.ut);
    if (tp && sel && !sel.value) sel.value = tp;
  }

  /* ------------------ Data ------------------ */
  const DATA_URL = "data/resources.json";
  const FALLBACK = [
    {
      id: "f-1",
      title: "Time Management for Students",
      description: "Strategies to balance studies and life.",
      type: "ebook",
      userType: "student",
      category: "skills",
      url: "#",
      date: "2025-01-07",
      size: "1.1 MB",
      tags: ["productivity"],
    },
    {
      id: "f-2",
      title: "Resume Checklist",
      description: "Everything recruiters look for.",
      type: "checklist",
      userType: "graduate",
      category: "resume",
      url: "#",
      date: "2025-03-01",
      size: "320 KB",
      tags: ["resume", "ATS"],
    },
    {
      id: "f-3",
      title: "Interview Q&A Masterclass",
      description: "Behavioral & situational Qs with STAR.",
      type: "article",
      userType: "graduate",
      category: "interviewing",
      url: "#",
      date: "2025-02-11",
      tags: ["STAR method"],
    },
    {
      id: "f-4",
      title: "Building Your LinkedIn Brand",
      description: "Make a profile that gets noticed.",
      type: "webinar",
      youtubeId: "dQw4w9WgXcQ",
      userType: "professional",
      category: "careers",
      date: "2024-12-10",
      minutes: 55,
      tags: ["linkedin", "networking"],
    },
    {
      id: "f-5",
      title: "Study Abroad Starter",
      description: "Scholarships and timelines.",
      type: "article",
      userType: "student",
      category: "study-abroad",
      url: "#",
      date: "2024-11-05",
      tags: ["scholarships"],
    },
  ];

  let ITEMS = [];
  const state = {
    q: "",
    ut: "",
    cat: "",
    typ: "",
    sort: "newest",
    page: 1,
    perPage: 9,
  };

  function normalize(rows) {
    return (Array.isArray(rows) ? rows : []).map((it) => {
      const o = {
        id: it.id || "res-" + Math.random().toString(36).slice(2),
        title: it.title || "Untitled Resource",
        description: it.description || "",
        author: it.author || "",
        provider: it.provider || "",
        url: it.url || "",
        youtubeId: it.youtubeId || "",
        thumb: it.thumb || "",
        minutes: Number(it.minutes || 0) || "",
        size: it.size || "",
        tags: Array.isArray(it.tags) ? it.tags : [],
        type: (it.type || "").toLowerCase().trim(),
        userType: (it.userType || "").toLowerCase().trim(),
        category: (it.category || "").toLowerCase().trim(),
        date: it.date || "2000-01-01",
      };
      if (!o.thumb && o.type !== "webinar") {
        o.thumb = "assets/resources/thumbs/placeholder.jpg";
      }
      return o;
    });
  }

  const icon = (t) =>
    ({
      webinar: "bi-camera-reels",
      ebook: "bi-book",
      checklist: "bi-ui-checks",
      article: "bi-journal-text",
    }[t] || "bi-journal-text");

  function card(r) {
    const meta = [
      r.category
        ? `<i class="bi bi-folder2 me-1"></i>${esc(
            r.category[0].toUpperCase() + r.category.slice(1)
          )}`
        : "",
      r.userType
        ? `<i class="bi bi-people me-1"></i>${esc(
            r.userType[0].toUpperCase() + r.userType.slice(1)
          )}`
        : "",
      r.minutes ? `<i class="bi bi-clock me-1"></i>${r.minutes}m` : "",
      r.size
        ? `<i class="bi bi-file-earmark-text me-1"></i>${esc(r.size)}`
        : "",
      r.date
        ? `<i class="bi bi-calendar-event me-1"></i>${new Date(
            r.date
          ).toLocaleDateString()}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const media =
      r.type === "webinar" && r.youtubeId
        ? `<div class="ratio ratio-16x9 mb-2">
          <iframe loading="lazy" title="${esc(r.title)}"
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
              r.youtubeId
            )}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
         </div>`
        : r.thumb
        ? `<div class="thumb mb-2"><img src="${esc(r.thumb)}" alt="${esc(
            r.title
          )}"></div>`
        : `<div class="thumb mb-2 d-flex align-items-center justify-content-center text-muted">No preview</div>`;

    const primary =
      r.type === "webinar" && r.youtubeId
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(r.youtubeId)}`
        : r.url || "#";

    const tags = (r.tags || [])
      .map(
        (t) => `<span class="chip"><i class="bi bi-tag"></i> ${esc(t)}</span>`
      )
      .join(" ");
    const bmActive = isBM(r.id) ? "bookmark-active" : "";

    return `
    <div class="col-12 col-md-6 col-xl-4">
      <article class="feature-card p-3 h-100 d-flex flex-column">
        <div class="d-flex align-items-start justify-content-between">
          <div class="icon-pill"><i class="bi ${icon(r.type)}"></i></div>
          <button class="btn btn-light btn-sm border-0 ${bmActive}" title="Bookmark"
                  data-bm="${r.id}" data-label="${esc(
      r.title
    )}" data-href="${esc(primary)}">
            <i class="bi bi-heart-fill"></i>
          </button>
        </div>
        <h6 class="mt-2 mb-1">${esc(r.title)}</h6>
        <div class="small muted mb-2">${meta || "&nbsp;"}</div>
        ${media}
        <p class="small muted mt-2 mb-2">${esc(r.description)}</p>
        <div class="d-flex flex-wrap gap-1 mb-2">${tags}</div>
        <div class="mt-auto d-flex flex-wrap gap-2">
          <a class="btn btn-outline-primary btn-sm" target="_blank" rel="noreferrer" href="${esc(
            primary
          )}">
            <i class="bi bi-box-arrow-up-right me-1"></i>${
              r.type === "webinar" ? "Watch" : "Open"
            }
          </a>
          ${
            r.url && r.type !== "webinar"
              ? `<a class="btn btn-light btn-sm" target="_blank" rel="noreferrer" href="${esc(
                  r.url
                )}"><i class="bi bi-download me-1"></i>Download</a>`
              : ""
          }
        </div>
      </article>
    </div>`;
  }

  function applyFilters() {
    const q = (state.q || "").toLowerCase();
    let rows = ITEMS.filter((r) => {
      const hay = [
        r.title,
        r.description,
        r.author,
        r.provider,
        r.category,
        r.userType,
        (r.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const mq = !q || hay.includes(q);
      const mu = !state.ut || r.userType === state.ut;
      const mc = !state.cat || r.category === state.cat;
      const mt = !state.typ || r.type === state.typ;
      return mq && mu && mc && mt;
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
    const start = (state.page - 1) * state.perPage,
      end = start + state.perPage;
    const totalPages = Math.max(1, Math.ceil(rows.length / state.perPage));
    return { slice: rows.slice(start, end), total: rows.length, totalPages };
  }

  function render() {
    const all = applyFilters();
    const { slice, total, totalPages } = paginate(all);

    hide($(SEL.skeleton));
    show($(SEL.grid));
    const result = $(SEL.result),
      grid = $(SEL.grid),
      pageInfo = $(SEL.pageInfo);
    if (result)
      result.textContent = total
        ? `${total} resource${total !== 1 ? "s" : ""}`
        : "No resources match your filters";
    if (pageInfo) pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
    if (grid)
      grid.innerHTML = slice.length
        ? slice.map(card).join("")
        : `<div class="col-12"><div class="alert alert-warning mb-0">No results. Try clearing filters.</div></div>`;

    // bind BM toggles
    $$("[data-bm]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const entry = {
          id: btn.getAttribute("data-bm"),
          label: btn.getAttribute("data-label") || "Resource",
          href: btn.getAttribute("data-href") || "#",
        };
        toggleBM(entry);
        $$(`[data-bm="${entry.id}"]`).forEach((b) =>
          b.classList.toggle("bookmark-active")
        );
      });
    });

    const prev = $(SEL.prev),
      next = $(SEL.next);
    if (prev) prev.disabled = state.page <= 1;
    if (next) next.disabled = state.page >= totalPages;
  }

  function wire() {
    $(SEL.search)?.addEventListener("input", (e) => {
      state.q = e.target.value;
      state.page = 1;
      render();
    });
    $(SEL.ut)?.addEventListener("change", (e) => {
      state.ut = (e.target.value || "").toLowerCase();
      state.page = 1;
      render();
    });
    $(SEL.cat)?.addEventListener("change", (e) => {
      state.cat = (e.target.value || "").toLowerCase();
      state.page = 1;
      render();
    });
    $(SEL.typ)?.addEventListener("change", (e) => {
      state.typ = (e.target.value || "").toLowerCase();
      state.page = 1;
      render();
    });
    $(SEL.sort)?.addEventListener("change", (e) => {
      state.sort = (e.target.value || "newest").toLowerCase();
      render();
    });
    $(SEL.per)?.addEventListener("change", (e) => {
      state.perPage = Number(e.target.value) || 9;
      state.page = 1;
      render();
    });

    $(SEL.clear)?.addEventListener("click", () => {
      state.q = "";
      state.ut = "";
      state.cat = "";
      state.typ = "";
      state.sort = "newest";
      state.page = 1;
      state.perPage = 9;
      if ($(SEL.search)) $(SEL.search).value = "";
      if ($(SEL.ut)) $(SEL.ut).value = "";
      if ($(SEL.cat)) $(SEL.cat).value = "";
      if ($(SEL.typ)) $(SEL.typ).value = "";
      if ($(SEL.sort)) $(SEL.sort).value = "newest";
      if ($(SEL.per)) $(SEL.per).value = "9";
      render();
    });

    $(SEL.prev)?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      render();
    });
    $(SEL.next)?.addEventListener("click", () => {
      state.page = state.page + 1;
      render();
    });

    $(SEL.bmExport)?.addEventListener("click", () => {
      const list = getBM();
      if (!list.length) {
        alert("No bookmarks to export.");
        return;
      }
      const text = list
        .map((x, i) => `${i + 1}. ${x.label}${x.href ? ` — ${x.href}` : ""}`)
        .join("\n");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Resource_Bookmarks.txt";
      a.click();
      URL.revokeObjectURL(url);
    });
    $(SEL.bmClear)?.addEventListener("click", () => {
      localStorage.removeItem(KEYS.BOOKMARKS);
      paintBM();
      render();
    });
  }

  // Robust fetch with timeout + graceful fallback
  async function fetchJSON(url, timeoutMs = 6000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort("timeout"), timeoutMs);
    try {
      const res = await fetch(url, { cache: "no-store", signal: ctl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(
          "[Resource Library] JSON parse error:",
          e,
          "\nRaw:",
          text.slice(0, 300)
        );
        throw new Error("Invalid JSON");
      }
    } finally {
      clearTimeout(t);
    }
  }

  async function init() {
    // Year stamps
    const y = new Date().getFullYear();
    if ($(SEL.year)) $(SEL.year).textContent = y;
    if ($(SEL.year2)) $(SEL.year2).textContent = y;

    // Personalization FIRST (NEW)
    paintHeaderProfile();

    // Sidebars
    paintRecent();
    paintBM();

    // Data load
    try {
      const raw = await fetchJSON(DATA_URL, 6000);
      ITEMS = normalize(raw);
      console.info(
        "[Resource Library] Loaded JSON:",
        DATA_URL,
        "items:",
        ITEMS.length
      );
    } catch (err) {
      console.warn(
        `[Resource Library] Could not load ${DATA_URL}: ${err.message}. Using fallback dataset.`
      );
      ITEMS = normalize(FALLBACK);
      const rc = $(SEL.result);
      if (rc)
        rc.innerHTML = `<span class="text-warning">Loaded fallback (check JSON path or serve over http[s]).</span>`;
    }

    // Sync state AFTER personalization prefill
    state.ut = ($(SEL.ut)?.value || "").toLowerCase();
    state.cat = ($(SEL.cat)?.value || "").toLowerCase();
    state.typ = ($(SEL.typ)?.value || "").toLowerCase();
    state.perPage = Number($(SEL.per)?.value) || 9;
    state.sort = ($(SEL.sort)?.value || "newest").toLowerCase();

    wire();
    render();

    // Auto-clear once if filters produced zero
    if (!applyFilters().length) $(SEL.clear)?.click();

    pushRecent("Opened Resource Library", "resources.html");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

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
    void btn.offsetWidth;
    btn.classList.add("ripple--animating");
    setTimeout(() => btn.classList.remove("ripple--animating"), 650);
  }
  $$(".ripple").forEach((b) => b.addEventListener("click", makeRipple));

  /* ---- Animate grid items injected by resources.js ---- */
  const grid = $("#grid");
  if (grid) {
    const mo = new MutationObserver(() => {
      // Add 'pop-in' to new columns/cards
      $$(".col-12, .col-md-6, .col-lg-4, .feature-card", grid).forEach(
        (n, i) => {
          if (!n.dataset._nsn_pop) {
            n.style.animationDelay = (i % 8) * 0.05 + "s";
            n.classList.add("pop-in");
            n.dataset._nsn_pop = "1";
          }
        }
      );
      // Fade-in thumbnails when images load
      $$("img", grid).forEach((img) => {
        if (!img.dataset._nsn_ready) {
          if (img.complete) {
            img.classList.add("is-ready");
            img.dataset._nsn_ready = "1";
          } else {
            img.addEventListener(
              "load",
              () => {
                img.classList.add("is-ready");
              },
              { once: true }
            );
            img.dataset._nsn_ready = "1";
          }
        }
      });
    });
    mo.observe(grid, { childList: true, subtree: true });
  }

  /* ---- When #grid becomes visible (skeleton removed), reveal smoothly ---- */
  const skel = $("#skeleton");
  const showGrid = new MutationObserver(() => {
    if (
      grid &&
      !grid.classList.contains("hidden") &&
      !grid.classList.contains("reveal")
    ) {
      grid.classList.add("reveal");
      io.observe(grid);
      showGrid.disconnect();
    }
  });
  if (grid)
    showGrid.observe(grid, { attributes: true, attributeFilter: ["class"] });
})();
