(function () {
  const DATA_URL = "data/stories.json";

  const $ = NSN.utils.$;
  const $$ = NSN.utils.$$;
  const esc = (s) => NSN.utils.escapeHTML(s || "");

  let ITEMS = [];
  const state = { q: "", ut: "", dom: "", sort: "newest", page: 1, perPage: 9 };

  /* -------- Personalization header -------- */
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

    // prefill user type filter once
    const sel = $("#userTypeFilter");
    if (tp && sel && !sel.value) sel.value = tp;
  }

  /* -------- Normalize dataset -------- */
  function normalize(rows) {
    return (rows || []).map((r) => ({
      id: r.id || `s-${Math.random().toString(36).slice(2)}`,
      name: r.name || "Anonymous",
      title: r.title || "",
      domain: (r.domain || "").toLowerCase().trim(),
      userType: (r.userType || "").toLowerCase().trim(),
      year: Number(r.year || new Date().getFullYear()),
      date: r.date || `${r.year || new Date().getFullYear()}-01-01`,
      summary: r.summary || "",
      story: r.story || "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      photo: r.photo || "",
      links: Array.isArray(r.links) ? r.links : [],
    }));
  }

  /* -------- Card renderer -------- */
  function itemCard(it) {
    const tags = (it.tags || [])
      .map(
        (t) => `<span class="chip"><i class="bi bi-tag"></i> ${esc(t)}</span>`
      )
      .join(" ");
    const bmActive = NSN.isBookmarked(it.id) ? "bookmark-active" : "";
    const detailsId = `details-${it.id}`;

    return `
      <div class="col-12 col-md-6 col-xl-4">
        <article class="feature-card p-3 h-100 d-flex flex-column" tabindex="0">
          <div class="d-flex align-items-start justify-content-between mb-2">
            <div class="icon-pill"><i class="bi bi-stars"></i></div>
            <button class="btn btn-light btn-sm border-0 ${bmActive}" title="Bookmark"
                    data-bm="${it.id}" data-label="${esc(it.name)} — ${esc(
      it.title
    )}" data-href="#${it.id}">
              <i class="bi bi-heart-fill"></i>
            </button>
          </div>
          <div class="thumb mb-2" aria-hidden="true">
            ${
              it.photo
                ? `<img loading="lazy" src="${esc(
                    it.photo
                  )}" alt="Photo of ${esc(it.name)}">`
                : ""
            }
          </div>
          <h6 class="mb-0">${esc(it.name)}</h6>
          <div class="meta small muted mb-1">
            <i class="bi bi-briefcase me-1"></i>${esc(it.title || "")}
            · <i class="bi bi-diagram-3 me-1"></i>${esc(it.domain)}
            · <i class="bi bi-people me-1"></i>${esc(it.userType)}
            · <i class="bi bi-calendar-event me-1"></i>${esc(String(it.year))}
          </div>
          <p class="small muted mb-2">${esc(it.summary)}</p>
          <div class="d-flex flex-wrap gap-1 mb-2">${tags}</div>

          <div class="mt-auto">
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-outline-primary btn-sm" data-more="${detailsId}">
                <i class="bi bi-journal-text me-1"></i> Read more
              </button>
              <button class="btn btn-light btn-sm" data-share='${esc(
                JSON.stringify({ id: it.id, name: it.name })
              )}'>
                <i class="bi bi-share me-1"></i> Share
              </button>
            </div>
            <div id="${detailsId}" class="mt-2 hidden">
              <hr/>
              <div class="story-body">${esc(it.story)}</div>
              ${
                it.links && it.links.length
                  ? `<div class="mt-2 related"><strong>Links:</strong> ${it.links
                      .map(
                        (l) => `<a href="${esc(
                          l.url
                        )}" target="_blank" rel="noopener noreferrer" class="me-2">
                       <i class="bi bi-box-arrow-up-right"></i> ${esc(
                         l.label || "Open"
                       )}</a>`
                      )
                      .join("")}</div>`
                  : ""
              }
              <div class="mt-2 related" data-related="${esc(it.domain)}"></div>
            </div>
          </div>
        </article>
      </div>`;
  }

  /* -------- Filters/Sort/Paging -------- */
  function applyFilters() {
    const q = state.q.trim().toLowerCase();
    let rows = ITEMS.filter((it) => {
      const text = `${it.name} ${it.title} ${it.summary} ${
        it.story
      } ${it.tags.join(" ")}`.toLowerCase();
      const matchesQ = !q || text.includes(q);
      const matchesUT = !state.ut || it.userType === state.ut;
      const matchesDom = !state.dom || it.domain === state.dom;
      return matchesQ && matchesUT && matchesDom;
    });

    rows.sort((a, b) => {
      switch (state.sort) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "az":
          return (a.name || "").localeCompare(b.name || "");
        case "za":
          return (b.name || "").localeCompare(a.name || "");
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

  /* -------- Render -------- */
  function render() {
    const all = applyFilters();
    const { slice, total, totalPages } = paginate(all);

    const resultCountEl = $("#resultCount");
    if (resultCountEl)
      resultCountEl.textContent = total
        ? `${total} stor${total === 1 ? "y" : "ies"}`
        : "No stories match your filters";

    const pageInfoEl = $("#pageInfo");
    if (pageInfoEl)
      pageInfoEl.textContent = `Page ${state.page} of ${totalPages}`;

    $("#skeleton")?.classList.add("hidden");

    const grid = $("#grid");
    if (grid) {
      grid.classList.remove("hidden");
      grid.innerHTML = slice.length
        ? slice.map(itemCard).join("")
        : `<div class="col-12"><div class="alert alert-warning mb-0">No results. Try clearing filters.</div></div>`;
    }

    wireCardActions();

    const prev = $("#prevPage"),
      next = $("#nextPage");
    if (prev) prev.disabled = state.page <= 1;
    if (next) next.disabled = state.page >= totalPages;
  }

  /* -------- Card actions -------- */
  function wireCardActions() {
    // read more
    $$("[data-more]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-more");
        const el = document.getElementById(id);
        if (el) {
          const wasHidden = el.classList.contains("hidden");
          el.classList.toggle("hidden");
          btn.innerHTML = wasHidden
            ? '<i class="bi bi-chevron-up me-1"></i> Hide'
            : '<i class="bi bi-journal-text me-1"></i> Read more';
          if (wasHidden) {
            // related (same domain)
            const host = el.querySelector("[data-related]");
            const domain = host?.getAttribute("data-related");
            if (host && domain) {
              const related = ITEMS.filter((x) => x.domain === domain).slice(
                0,
                3
              );
              host.innerHTML = related.length
                ? `<strong>Related:</strong> ` +
                  related
                    .map(
                      (r) => `<a href="#" class="me-2" data-open="${r.id}">
                       <i class="bi bi-person-raised-hand"></i> ${esc(
                         r.name
                       )}</a>`
                    )
                    .join("")
                : "";
              $$("[data-open]").forEach((a) =>
                a.addEventListener("click", (e) => {
                  e.preventDefault();
                  openDetails(a.getAttribute("data-open"));
                })
              );
            }
          }
        }
      });
    });

    // share
    $$("[data-share]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const meta = JSON.parse(btn.getAttribute("data-share"));
        const url =
          location.origin +
          location.pathname +
          `?id=${encodeURIComponent(meta.id)}`;
        const title = "Success Story — " + meta.name;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
          } else {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard");
          }
        } catch {}
      });
    });

    // bookmarks
    $$("[data-bm]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const entry = {
          id: btn.getAttribute("data-bm"),
          label: btn.getAttribute("data-label") || "Story",
          href: btn.getAttribute("data-href") || "#",
        };
        NSN.toggleBookmark(entry, "#bookmarkList");
        $$(`[data-bm="${entry.id}"]`).forEach((b) =>
          b.classList.toggle("bookmark-active")
        );
      });
    });
  }

  function openDetails(id) {
    const el = document.getElementById(`details-${CSS.escape(id)}`);
    if (el && el.classList.contains("hidden")) {
      el.classList.remove("hidden");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* -------- UI wiring -------- */
  function wireUI() {
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
    $("#domainFilter")?.addEventListener("change", (e) => {
      state.dom = e.target.value;
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
      state.dom = "";
      state.sort = "newest";
      state.page = 1;
      state.perPage = 9;
      if ($("#search")) $("#search").value = "";
      if ($("#userTypeFilter")) $("#userTypeFilter").value = "";
      if ($("#domainFilter")) $("#domainFilter").value = "";
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

  /* -------- Init -------- */
  async function init() {
    NSN.utils.setYear("#year");
    paintHeaderProfile();

    // Shared sidebars
    NSN.getRecent();
    NSN.paintRecent("#recentList");
    NSN.paintBookmarks("#bookmarkList");

    try {
      const raw = await NSN.loadJSON(DATA_URL, {
        fallback: [],
        onErrorMessageSelector: "#resultCount",
      });
      ITEMS = normalize(raw);
    } catch (e) {
      console.error(e);
      alert(e.message || `Failed to load ${DATA_URL}`);
      return;
    }

    // Init state from selects
    state.ut = $("#userTypeFilter")?.value || "";
    state.dom = $("#domainFilter")?.value || "";
    state.perPage = Number($("#perPage")?.value) || 9;
    state.sort = $("#sortBy")?.value || "newest";

    wireUI();
    render();

    // deep link open (?id=...)
    const id = new URLSearchParams(location.search).get("id");
    if (id) setTimeout(() => openDetails(id), 400);

    NSN.pushRecent("Opened Success Stories", "stories.html", "#recentList");

    // Dev diagnostics (only on localhost)
    if (
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      const el = document.createElement("div");
      el.style.cssText =
        "position:fixed;bottom:12px;left:12px;z-index:9999;background:#111;color:#fff;padding:8px 12px;border-radius:8px;font:12px/1.4 system-ui;opacity:.92";
      el.textContent = "Diagnostics: running…";
      document.body.appendChild(el);
      try {
        const res = await fetch(DATA_URL, { cache: "no-store" });
        el.textContent = `Diagnostics: ${res.ok ? "OK" : "FAIL"} (status ${
          res.status
        })`;
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          el.textContent += ` • parsed ${
            Array.isArray(json) ? json.length : "n/a"
          } items`;
        } catch {
          el.textContent += " • JSON parse error";
        }
      } catch {
        el.textContent = "Diagnostics: fetch threw";
      }
      setTimeout(() => el.remove(), 6000);
    }
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

  /* ---- Animate grid items when stories.js injects them ---- */
  const grid = $("#grid");
  if (grid) {
    const mo = new MutationObserver(() => {
      // Staggered pop-in for new columns/cards
      $$(".col-12, .col-md-6, .col-xl-4, .feature-card", grid).forEach(
        (n, i) => {
          if (!n.dataset._nsn_pop) {
            n.style.animationDelay = (i % 8) * 0.05 + "s";
            n.classList.add("pop-in");
            n.dataset._nsn_pop = "1";
          }
        }
      );
      // Fade-in thumbnails once images load
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
