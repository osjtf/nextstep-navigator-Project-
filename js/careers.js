const $ = NSN.utils.$;
const $$ = NSN.utils.$$;

let CAREERS = [];

const state = {
  q: "",
  industries: new Set(),
  min: null,
  max: null,
  sort: "az",
  page: 1,
  perPage: 12,
  view: "grid",
};

const MONEY = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const fmtMoney = (n) => MONEY.format(Math.round(Number(n) || 0));

/* -----------------------------
   Data loading / normalization
----------------------------- */
function normalizeCareers(rows) {
  return (rows || []).map((r) => {
    const skills = Array.isArray(r.skills)
      ? r.skills
      : typeof r.skills === "string"
      ? r.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const salaryMin = Number(r.salaryMin ?? 0);
    const salaryMax = Number(r.salaryMax ?? 0);
    return {
      id: r.id || `c-${Math.random().toString(36).slice(2)}`,
      title: r.title || "Untitled Role",
      industry: (r.industry || "").trim() || "General",
      icon: r.icon || "bi-briefcase",
      education: r.education || "Varies",
      salaryMin: Number.isFinite(salaryMin) ? salaryMin : 0,
      salaryMax: Number.isFinite(salaryMax) ? salaryMax : 0,
      skills,
    };
  });
}

/* -----------------------------
   Personalization labels
----------------------------- */
function paintHeaderProfile() {
  const nm = sessionStorage.getItem("nsn_name") || "";
  const tp = sessionStorage.getItem("nsn_type") || "";
  const hello = $("#helloUser");
  const active = $("#activeProfile");
  if (hello)
    hello.textContent =
      nm || tp
        ? `Hi ${nm ? nm : ""}${nm && tp ? " • " : ""}${
            tp ? tp[0].toUpperCase() + tp.slice(1) : ""
          }`
        : "";
  if (active) active.textContent = tp ? `Tailored for: ${tp}` : "";
}

/* -----------------------------
   Filters
----------------------------- */
function buildIndustryList() {
  const box = $("#industryList");
  if (!box) return;
  const list = [...new Set(CAREERS.map((c) => c.industry))].sort((a, b) =>
    a.localeCompare(b)
  );
  box.innerHTML = "";
  list.forEach((ind) => {
    const id = "ind-" + ind.toLowerCase().replace(/\W+/g, "-");
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="form-check">
        <input class="form-check-input ind" type="checkbox" id="${id}" value="${NSN.utils.escapeHTML(
      ind
    )}">
        <label class="form-check-label" for="${id}">${NSN.utils.escapeHTML(
      ind
    )}</label>
      </div>`;
    box.appendChild(wrap.firstElementChild);
  });
  $$(".ind").forEach((cb) =>
    cb.addEventListener("change", () => {
      cb.checked
        ? state.industries.add(cb.value)
        : state.industries.delete(cb.value);
      state.page = 1;
      render();
    })
  );
}

/* -----------------------------
   Search / Sort / Filter / Page
----------------------------- */
function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let rows = CAREERS.filter((c) => {
    const hay = `${c.title} ${c.industry} ${c.education} ${c.skills.join(
      " "
    )}`.toLowerCase();
    const matchesQ = !q || hay.includes(q);
    const inInd = !state.industries.size || state.industries.has(c.industry);
    const inSal =
      (state.min == null || c.salaryMax >= state.min) &&
      (state.max == null || c.salaryMin <= state.max);
    return matchesQ && inInd && inSal;
  });

  rows.sort((a, b) => {
    switch (state.sort) {
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      case "salarydesc":
        return (
          (b.salaryMax + b.salaryMin) / 2 - (a.salaryMax + a.salaryMin) / 2
        );
      case "salaryasc":
        return (
          (a.salaryMax + a.salaryMin) / 2 - (b.salaryMax + b.salaryMin) / 2
        );
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

/* -----------------------------
   Rendering
----------------------------- */
function cardGrid(c) {
  const avg = Math.round((c.salaryMin + c.salaryMax) / 2);
  const skills = c.skills
    .slice(0, 4)
    .map((s) => `<span class="chip skill">${NSN.utils.escapeHTML(s)}</span>`)
    .join(" ");
  const bmActive = NSN.isBookmarked(c.id) ? "bookmark-active" : "";
  return `
    <div class="col-12 col-md-6 col-xl-4">
      <div class="feature-card p-3 h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start">
          <div class="icon-pill"><i class="bi ${c.icon}"></i></div>
          <button class="btn btn-light btn-sm border-0 ${bmActive}" title="Bookmark" data-bm="${
    c.id
  }" data-label="${NSN.utils.escapeHTML(c.title)}">
            <i class="bi bi-heart-fill"></i>
          </button>
        </div>
        <h5 class="mt-2 mb-1">${NSN.utils.escapeHTML(c.title)}</h5>
        <div class="small muted mb-2"><i class="bi bi-diagram-3 me-1"></i>${NSN.utils.escapeHTML(
          c.industry
        )}</div>
        <div class="mb-2 d-flex flex-wrap gap-1">${skills}</div>
        <div class="mt-auto">
          <div class="small muted">Education: ${NSN.utils.escapeHTML(
            c.education
          )}</div>
          <div class="fw-semibold salary mt-1">${fmtMoney(
            c.salaryMin
          )} – ${fmtMoney(
    c.salaryMax
  )} <span class="text-secondary small">avg ${fmtMoney(avg)}</span></div>
          <div class="card-actions d-flex gap-2 mt-3">
            <a class="btn btn-outline-primary btn-sm" href="#" data-view="${
              c.id
            }"><i class="bi bi-eye me-1"></i>View</a>
            <button class="btn btn-primary btn-sm" data-bm="${
              c.id
            }" data-label="${NSN.utils.escapeHTML(
    c.title
  )}"><i class="bi bi-bookmark-plus me-1"></i>Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function rowList(c) {
  const avg = Math.round((c.salaryMin + c.salaryMax) / 2);
  const skills = c.skills
    .slice(0, 5)
    .map((s) => `<span class="chip skill">${NSN.utils.escapeHTML(s)}</span>`)
    .join(" ");
  const bmActive = NSN.isBookmarked(c.id) ? "bookmark-active" : "";
  return `
    <div class="feature-card p-3 mb-2">
      <div class="d-flex align-items-start justify-content-between">
        <div class="d-flex align-items-start gap-3">
          <div class="icon-pill"><i class="bi ${c.icon}"></i></div>
          <div>
            <h5 class="mb-1">${NSN.utils.escapeHTML(c.title)}</h5>
            <div class="small muted mb-2"><i class="bi bi-diagram-3 me-1"></i>${NSN.utils.escapeHTML(
              c.industry
            )}</div>
            <div class="d-flex flex-wrap gap-1 mb-1">${skills}</div>
            <div class="small">Education: ${NSN.utils.escapeHTML(
              c.education
            )}</div>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-semibold salary">${fmtMoney(c.salaryMin)} – ${fmtMoney(
    c.salaryMax
  )}</div>
          <div class="small text-secondary">avg ${fmtMoney(avg)}</div>
          <div class="mt-2 d-flex gap-2 justify-content-end">
            <a class="btn btn-outline-primary btn-sm" href="#" data-view="${
              c.id
            }"><i class="bi bi-eye me-1"></i>View</a>
            <button class="btn btn-light btn-sm border-0 ${bmActive}" title="Bookmark" data-bm="${
    c.id
  }" data-label="${NSN.utils.escapeHTML(c.title)}">
              <i class="bi bi-heart-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function render() {
  const all = applyFilters();
  const { slice, total, totalPages } = paginate(all);

  const resultCount = $("#resultCount");
  if (resultCount)
    resultCount.textContent = `${total} career${total !== 1 ? "s" : ""} found`;
  const pageInfo = $("#pageInfo");
  if (pageInfo) pageInfo.textContent = `Page ${state.page} of ${totalPages}`;

  $("#skeleton")?.classList.add("hidden");

  if (state.view === "grid") {
    $("#list")?.classList.add("hidden");
    const grid = $("#grid");
    grid?.classList.remove("hidden");
    if (grid)
      grid.innerHTML = slice.length
        ? slice.map(cardGrid).join("")
        : `<div class="col-12"><div class="alert alert-warning mb-0">No results. Try clearing filters.</div></div>`;
  } else {
    $("#grid")?.classList.add("hidden");
    const list = $("#list");
    list?.classList.remove("hidden");
    if (list)
      list.innerHTML = slice.length
        ? slice.map(rowList).join("")
        : `<div class="feature-card p-3"><div class="text-warning">No results. Try clearing filters.</div></div>`;
  }

  bindRowActions();

  const prev = $("#prevPage"),
    next = $("#nextPage");
  if (prev) prev.disabled = state.page <= 1;
  if (next) next.disabled = state.page >= totalPages;
}

/* -----------------------------
   Bookmarks & Recent (shared)
----------------------------- */
function bindRowActions() {
  // Bookmark buttons
  $$("[data-bm]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.getAttribute("data-bm");
      const label = btn.getAttribute("data-label") || "Career";
      const item = CAREERS.find((c) => c.id === id);
      if (!item) return;
      NSN.toggleBookmark({ id, href: "#", label }, "#bookmarkList");
      // toggle style on both grid/list buttons
      $$(`[data-bm="${id}"]`).forEach((b) =>
        b.classList.toggle("bookmark-active")
      );
    });
  });

  // View buttons (simple quick view)
  $$("[data-view]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("data-view");
      const item = CAREERS.find((c) => c.id === id);
      if (!item) return;
      NSN.pushRecent(
        item.title,
        `careers.html?c=${encodeURIComponent(item.id)}`,
        "#recentList"
      );
      alert(`${item.title}
Industry: ${item.industry}
Skills: ${item.skills.join(", ")}
Education: ${item.education}
Salary: ${fmtMoney(item.salaryMin)}–${fmtMoney(item.salaryMax)}`);
    });
  });
}

/* -----------------------------
   UI wiring
----------------------------- */
function wireUI() {
  // Search
  $("#search")?.addEventListener("input", (e) => {
    state.q = e.target.value;
    state.page = 1;
    render();
  });

  // Salary
  $("#minSalary")?.addEventListener("change", (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    state.min = v != null && !Number.isNaN(v) ? v : null;
    state.page = 1;
    render();
  });
  $("#maxSalary")?.addEventListener("change", (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    state.max = v != null && !Number.isNaN(v) ? v : null;
    state.page = 1;
    render();
  });

  // Sort
  $("#sortBy")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  // Per page
  $("#perPage")?.addEventListener("change", (e) => {
    state.perPage = Number(e.target.value) || 12;
    state.page = 1;
    render();
  });

  // Pagination
  $("#prevPage")?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });
  $("#nextPage")?.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  // Clear filters
  $("#btnClearFilters")?.addEventListener("click", () => {
    state.q = "";
    state.industries.clear();
    state.min = null;
    state.max = null;
    state.sort = "az";
    state.page = 1;
    state.perPage = 12;
    const s = $("#search");
    if (s) s.value = "";
    const mn = $("#minSalary");
    if (mn) mn.value = "";
    const mx = $("#maxSalary");
    if (mx) mx.value = "";
    const sb = $("#sortBy");
    if (sb) sb.value = "az";
    const pp = $("#perPage");
    if (pp) pp.value = "12";
    $$(".ind").forEach((cb) => (cb.checked = false));
    render();
  });

  // View toggle
  $("#btnGrid")?.addEventListener("click", () => {
    state.view = "grid";
    $("#btnGrid")?.classList.add("active");
    $("#btnList")?.classList.remove("active");
    render();
  });
  $("#btnList")?.addEventListener("click", () => {
    state.view = "list";
    $("#btnList")?.classList.add("active");
    $("#btnGrid")?.classList.remove("active");
    render();
  });

  // Bookmarks (shared controls)
  $("#exportBookmarks")?.addEventListener("click", () =>
    NSN.exportBookmarks("Career_Bookmarks.txt")
  );
  $("#clearBookmarks")?.addEventListener("click", () => {
    NSN.clearBookmarks("#bookmarkList");
    render();
  });
}

/* -----------------------------
   Deep link helpers
----------------------------- */
function applyQueryParams() {
  const p = new URLSearchParams(location.search);

  // ?q=search
  const q = p.get("q");
  if (q) {
    state.q = q;
    const s = $("#search");
    if (s) s.value = q;
  }

  // ?industry=Technology
  const ind = p.get("industry");
  if (ind) {
    // Check the box if it exists; else add to state
    const id = "ind-" + ind.toLowerCase().replace(/\W+/g, "-");
    const cb = document.getElementById(id);
    if (cb) {
      cb.checked = true;
      state.industries.add(ind);
    } else {
      state.industries.add(ind);
    }
  }

  // ?c=careerId → open quick view after first render
  const cid = p.get("c");
  if (cid) {
    setTimeout(() => {
      const item = CAREERS.find((c) => c.id === cid);
      if (item) {
        NSN.pushRecent(
          item.title,
          `careers.html?c=${encodeURIComponent(item.id)}`,
          "#recentList"
        );
        alert(`${item.title}
Industry: ${item.industry}
Skills: ${item.skills.join(", ")}
Education: ${item.education}
Salary: ${fmtMoney(item.salaryMin)}–${fmtMoney(item.salaryMax)}`);
      }
    }, 400);
  }
}

/* -----------------------------
   Init
----------------------------- */
async function init() {
  NSN.utils.setYear("#year");
  paintHeaderProfile();

  // Shared sidebars
  NSN.getRecent(); // sanitize any old data
  NSN.paintRecent("#recentList");
  NSN.paintBookmarks("#bookmarkList");

  // Load careers data
  const raw = await NSN.loadJSON("data/careers.json", {
    fallback: [],
    onErrorMessageSelector: "#resultCount",
  });
  CAREERS = normalizeCareers(raw);

  buildIndustryList();
  wireUI();
  render();

  applyQueryParams();

  NSN.pushRecent("Opened Careers", "careers.html", "#recentList");
}

document.addEventListener("DOMContentLoaded", init);

// animations


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

  /* ---- Animate grid/list when careers.js injects items ---- */
  const grid = $("#grid");
  const list = $("#list");

  function onInject(container, selectorForItems) {
    if (!container) return;
    const mo = new MutationObserver(() => {
      $$(selectorForItems, container).forEach((n, i) => {
        if (!n.dataset._nsn_pop) {
          n.style.animationDelay = (i % 10) * 0.05 + "s";
          n.classList.add("pop-in");
          n.dataset._nsn_pop = "1";
        }
      });
    });
    mo.observe(container, { childList: true, subtree: true });
  }
  onInject(grid, ".col-12, .col-md-6, .col-xl-4, .feature-card");
  onInject(list, ".feature-card, .list-group-item");

  /* ---- When #grid/#list become visible (skeleton removed), reveal smoothly ---- */
  const showObs = new MutationObserver(() => {
    [grid, list].forEach((el) => {
      if (
        el &&
        !el.classList.contains("hidden") &&
        !el.classList.contains("reveal")
      ) {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
  });
  showObs.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  /* ---- Pagination buttons subtle refresh cue ---- */
  const prev = $("#prevPage"),
    next = $("#nextPage"),
    pageInfo = $("#pageInfo");
  function cueSwap() {
    [prev, next].forEach((btn) => {
      btn?.classList.remove("swapped");
      void btn?.offsetWidth;
      btn?.classList.add("swapped");
    });
  }
  const pageMo = new MutationObserver(cueSwap);
  if (pageInfo)
    pageMo.observe(pageInfo, {
      childList: true,
      characterData: true,
      subtree: true,
    });

  /* ---- Bookmark ping support (if careers.js toggles .bookmark-active) ---- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest && t.closest(".bookmark-toggle")) {
      /* purely visual; your JS handles state */
    }
  });
})();
