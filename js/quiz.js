/***********************
 * Tiny utilities (NSN-free)
 ***********************/
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const utils = {
  escapeHTML: (str = "") =>
    ("" + str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;"),
  setYear: (sel) => {
    const el = $(sel);
    if (el) el.textContent = new Date().getFullYear();
  },
  async loadJSON(url, { fallback = null, onErrorSelector = null } = {}) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return await r.json();
    } catch (e) {
      if (onErrorSelector) {
        const t = $(onErrorSelector);
        if (t) t.textContent = "Using fallback data (offline).";
      }
      return fallback;
    }
  },
};

/***********************
 * Bookmarks & Recent (localStorage)
 ***********************/
const LS_BOOK = "nsn_bookmarks";
const LS_REC = "nsn_recent";

const store = {
  getJSON(key, def) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? def;
    } catch {
      return def;
    }
  },
  setJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
};

const Bookmarks = {
  list() {
    return store.getJSON(LS_BOOK, []);
  },
  is(id) {
    return !!this.list().find((x) => x.id === id);
  },
  toggle(entry) {
    const all = this.list();
    const i = all.findIndex((x) => x.id === entry.id);
    if (i > -1) {
      all.splice(i, 1);
    } else {
      all.unshift(entry);
    }
    store.setJSON(LS_BOOK, all);
    return i === -1;
  },
  export(filename = "Bookmarks.txt") {
    const lines = this.list().map(
      (b) => `• ${b.label}  —  ${location.origin}/${b.href.replace(/^\//, "")}`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  clear() {
    store.setJSON(LS_BOOK, []);
  },
};

function paintBookmarks(sel) {
  const ul = $(sel);
  if (!ul) return;
  const items = Bookmarks.list();
  if (!items.length) {
    ul.innerHTML = '<li class="text-muted">No bookmarks yet.</li>';
    return;
  }
  ul.innerHTML = items
    .map(
      (
        b
      ) => `<li class="d-flex justify-content-between align-items-center py-1">
      <a class="small" href="${utils.escapeHTML(b.href)}">${utils.escapeHTML(
        b.label
      )}</a>
      <button class="btn btn-sm btn-outline-danger" data-rm="${utils.escapeHTML(
        b.id
      )}" title="Remove"><i class="bi bi-x"></i></button>
    </li>`
    )
    .join("");
  $$("[data-rm]").forEach((btn) => {
    btn.addEventListener("click", () => {
      Bookmarks.toggle({ id: btn.dataset.rm, label: "", href: "#" });
      paintBookmarks(sel);
      $$('[data-bm="' + btn.dataset.rm + '"]').forEach((b) =>
        b.classList.remove("bookmark-active")
      );
    });
  });
}

const Recent = {
  push(label, href) {
    const all = store.getJSON(LS_REC, []);
    all.unshift({ label, href, ts: Date.now() });
    if (all.length > 20) all.length = 20;
    store.setJSON(LS_REC, all);
  },
  list() {
    return store.getJSON(LS_REC, []);
  },
};

function paintRecent(sel) {
  const ul = $(sel);
  if (!ul) return;
  const items = Recent.list();
  if (!items.length) {
    ul.innerHTML = '<li class="text-muted">Nothing yet.</li>';
    return;
  }
  ul.innerHTML = items
    .map(
      (i) =>
        `<li class="py-1 small"><a href="${utils.escapeHTML(
          i.href
        )}">${utils.escapeHTML(i.label)}</a></li>`
    )
    .join("");
}

/***********************
 * Anim helpers: reveal & ripple & progress glow
 ***********************/

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

(function bootstrapAnimations() {
  // Scroll reveal
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

  // Ripple
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
})();

/***********************
 * Data containers
 ***********************/
let CAREERS = []; // from data/careers.json (or fallback)
let QUIZ_DATA = {}; // from data/quiz.json (expanded)

// Fallback mini datasets to keep page functional offline
const FALLBACK_CAREERS = [
  {
    id: "se",
    title: "Software Engineer",
    industry: "Technology",
    icon: "bi-code-slash",
    href: "careers.html?c=se",
  },
  {
    id: "ds",
    title: "Data Scientist",
    industry: "Technology",
    icon: "bi-diagram-3",
    href: "careers.html?c=ds",
  },
  {
    id: "pm",
    title: "Product Manager",
    industry: "Business",
    icon: "bi-kanban",
    href: "careers.html?c=pm",
  },
  {
    id: "ux",
    title: "UX Designer",
    industry: "Design",
    icon: "bi-palette",
    href: "careers.html?c=ux",
  },
  {
    id: "rn",
    title: "Registered Nurse",
    industry: "Healthcare",
    icon: "bi-heart-pulse",
    href: "careers.html?c=rn",
  },
  {
    id: "me",
    title: "Mechanical Engineer",
    industry: "Engineering",
    icon: "bi-gear",
    href: "careers.html?c=me",
  },
  {
    id: "ba",
    title: "Business Analyst",
    industry: "Business",
    icon: "bi-graph-up",
    href: "careers.html?c=ba",
  },
  {
    id: "gd",
    title: "Graphic Designer",
    industry: "Design",
    icon: "bi-brush",
    href: "careers.html?c=gd",
  },
];

const FALLBACK_QUIZ = {
  technology: {
    total: 4,
    questions: [
      {
        q: "Which activity sounds most fun?",
        choices: [
          { t: "Coding an app prototype", s: { technology: 3, design: 1 } },
          { t: "Sketching a brand concept", s: { design: 3 } },
          { t: "Planning a product launch", s: { business: 3 } },
        ],
      },
      {
        q: "Pick a puzzle to solve:",
        choices: [
          {
            t: "Automate a repetitive task",
            s: { technology: 3, engineering: 1 },
          },
          {
            t: "Improve a hospital workflow",
            s: { healthcare: 3, business: 1 },
          },
          { t: "Redesign a confusing form", s: { design: 3 } },
        ],
      },
      {
        q: "What do you want to learn next?",
        choices: [
          { t: "Python / JS frameworks", s: { technology: 3 } },
          { t: "Clinical decision-making", s: { healthcare: 3 } },
          { t: "Market analysis & strategy", s: { business: 3 } },
        ],
      },
      {
        q: "Your ideal project role:",
        choices: [
          {
            t: "Build features hands-on",
            s: { technology: 3, engineering: 1 },
          },
          { t: "Coordinate teams & roadmaps", s: { business: 3 } },
          { t: "Shape interfaces & visuals", s: { design: 3 } },
        ],
      },
    ],
  },
  // Aliases show off the "use" feature replicated below
  business: { use: "technology" },
  design: { use: "technology" },
  healthcare: { use: "technology" },
  engineering: { use: "technology" },
};

/***********************
 * Stream <-> Industry mapping
 ***********************/
const STREAM_TO_INDUSTRY = {
  technology: "Technology",
  business: "Business",
  design: "Design",
  healthcare: "Healthcare",
  engineering: "Engineering",
};

/***********************
 * State
 ***********************/
const state = {
  interest: null,
  idx: 0,
  answers: [],
  scores: {
    technology: 0,
    business: 0,
    design: 0,
    healthcare: 0,
    engineering: 0,
  },
};

/***********************
 * Header personalisation
 ***********************/
function paintHeaderProfile() {
  const nm = sessionStorage.getItem("nsn_name") || "";
  const tp = sessionStorage.getItem("nsn_type") || "";
  const who =
    nm || tp
      ? `Hi ${nm ? nm : ""}${nm && tp ? " • " : ""}${
          tp ? tp[0].toUpperCase() + tp.slice(1) : ""
        }`
      : "";
  const label = tp ? `Tailored for: ${tp}` : "";
  const helloEl = $("#helloUser");
  const activeEl = $("#activeProfile");
  if (helloEl) helloEl.textContent = who;
  if (activeEl) activeEl.textContent = label;
}

/***********************
 * Expand quiz aliases like { use: 'technology' }
 ***********************/
function expandQuizAliases(quiz) {
  const out = JSON.parse(JSON.stringify(quiz || {}));
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === "object" && "use" in v) {
      const ref = v.use;
      if (!out[ref] || !out[ref].questions) {
        throw new Error(
          `quiz.json: category "${k}" references missing "${ref}"`
        );
      }
      out[k] = out[ref];
    }
  }
  return out;
}

/***********************
 * Quiz flow
 ***********************/
function startQuiz(interest) {
  state.interest = interest;
  state.idx = 0;

  const pack = QUIZ_DATA[interest];
  if (!pack || !Array.isArray(pack.questions)) {
    alert("Quiz content unavailable for this interest.");
    return;
  }

  state.answers = Array(pack.total).fill(null);
  state.scores = {
    technology: 0,
    business: 0,
    design: 0,
    healthcare: 0,
    engineering: 0,
  };

  $("#setup")?.classList.add("hidden");
  $("#quizPanel")?.classList.remove("hidden");
  $("#results")?.classList.add("hidden");

  $("#qTotal") && ($("#qTotal").textContent = pack.total);
  const active = $("#profileMini");
  if (active)
    active.textContent = `Interest focus: ${
      interest[0].toUpperCase() + interest.slice(1)
    }`;

  renderQuestion();
  Recent.push("Started Interest Quiz", "quiz.html");
  paintRecent("#recentList");
}

function renderQuestion() {
  const pack = QUIZ_DATA[state.interest];
  const q = pack.questions[state.idx];

  $("#qIndex") && ($("#qIndex").textContent = state.idx + 1);
  $("#qText") && ($("#qText").textContent = q.q);

  const pct = Math.round((state.idx / pack.total) * 100);
  const bar = $("#progressBar");
  if (bar) bar.style.width = pct + "%";
  const wrap = $("#progressWrap");
  if (wrap) {
    wrap.classList.remove("glow");
    void wrap.offsetWidth;
    wrap.classList.add("glow");
  }

  const choicesWrap = $("#choices");
  if (!choicesWrap) return;
  choicesWrap.innerHTML = "";
  q.choices.forEach((c, i) => {
    const d = document.createElement("label");
    d.className = "choice";
    if (state.answers[state.idx] === i) d.classList.add("active");
    d.innerHTML = `<input type="radio" name="choice" value="${i}"> ${utils.escapeHTML(
      c.t
    )}`;
    d.addEventListener("click", () => {
      state.answers[state.idx] = i;
      $$(".choice").forEach((x) => x.classList.remove("active"));
      d.classList.add("active");
      const btnReview = $("#btnReview");
      if (btnReview)
        btnReview.disabled = !state.answers.some((a) => a !== null);
    });
    choicesWrap.appendChild(d);
  });

  const btnPrev = $("#btnPrev");
  const btnNext = $("#btnNext");
  if (btnPrev) btnPrev.disabled = state.idx === 0;
  if (btnNext)
    btnNext.textContent = state.idx === pack.total - 1 ? "Finish" : "Next";
}

function applyScores() {
  state.scores = {
    technology: 0,
    business: 0,
    design: 0,
    healthcare: 0,
    engineering: 0,
  };
  const pack = QUIZ_DATA[state.interest];
  state.answers.forEach((ans, i) => {
    if (ans === null) return;
    const weights = pack.questions[i].choices[ans].s;
    for (const k in weights) state.scores[k] += weights[k];
  });
}

function toRanked(obj) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([stream, score]) => ({ stream, score }));
}

function careerCard(c) {
  const active = Bookmarks.is(c.id) ? "bookmark-active" : "";
  const href = c.href || `careers.html?c=${encodeURIComponent(c.id)}`;
  return `
      <div class="col-12 col-md-6">
        <div class="feature-card p-3 h-100 d-flex align-items-start justify-content-between">
          <div class="d-flex align-items-start gap-3">
            <div class="icon-pill"><i class="bi ${
              c.icon || "bi-briefcase"
            }"></i></div>
            <div>
              <div class="small text-uppercase text-muted">${utils.escapeHTML(
                c.industry || ""
              )}</div>
              <h6 class="mb-1">${utils.escapeHTML(c.title)}</h6>
              <a class="small" href="${href}">Open in Career Bank</a>
            </div>
          </div>
          <button class="btn btn-light btn-sm border-0 ${active}" title="Bookmark"
            data-bm="${utils.escapeHTML(c.id)}"
            data-label="${utils.escapeHTML(c.title)}"
            data-href="${utils.escapeHTML(href)}">
            <i class="bi bi-heart-fill"></i>
          </button>
        </div>
      </div>
    `;
}

function bindCareerActions() {
  $$("[data-bm]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const entry = {
        id: btn.getAttribute("data-bm"),
        label: btn.getAttribute("data-label") || "Career",
        href: btn.getAttribute("data-href") || "#",
      };
      const added = Bookmarks.toggle(entry);
      paintBookmarks("#bookmarkList");
      $$(`[data-bm="${entry.id}"]`).forEach((b) => {
        b.classList.toggle("bookmark-active", added);
      });
    });
  });
}

function showResults() {
  applyScores();
  const ranked = toRanked(state.scores).filter((x) => x.score > 0);

  $("#quizPanel")?.classList.add("hidden");
  const res = $("#results");
  res?.classList.remove("hidden");
  res?.classList.add("swap-enter");
  setTimeout(() => res?.classList.remove("swap-enter"), 350);

  // Streams badges
  const sb = $("#streamBadges");
  if (sb) {
    sb.innerHTML = ranked.length
      ? ranked
          .slice(0, 3)
          .map(
            (x) =>
              `<span class="badge text-bg-primary">${utils.escapeHTML(
                x.stream
              )} • ${x.score}</span>`
          )
          .join(" ")
      : '<span class="text-muted small">No signals yet — try retaking.</span>';
  }

  // Careers: match by Industry from top 2–3 streams
  const topStreams = ranked.slice(0, 3).map((x) => x.stream);
  const industries = topStreams
    .map((s) => STREAM_TO_INDUSTRY[s])
    .filter(Boolean);
  const matches = CAREERS.filter((c) =>
    industries.includes((c.industry || "").trim())
  );
  const seen = new Set();
  const unique = [];
  for (const c of matches) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    unique.push(c);
    if (unique.length >= 6) break;
  }

  const grid = $("#careerGrid");
  if (grid) {
    grid.innerHTML = unique.length
      ? unique.map((c) => careerCard(c)).join("")
      : '<div class="col-12"><div class="alert alert-warning mb-0">No career suggestions found. Try another interest.</div></div>';
  }

  bindCareerActions();
  Recent.push("Viewed Quiz Results", "quiz.html#results");
  paintRecent("#recentList");
}

/***********************
 * Review / Export
 ***********************/
function paintReview() {
  const pack = QUIZ_DATA[state.interest];
  const list = $("#reviewList");
  if (!list) return;
  list.innerHTML = "";
  state.answers.forEach((ans, i) => {
    const li = document.createElement("li");
    const ansText =
      ans !== null ? pack.questions[i].choices[ans].t : "(no answer)";
    li.textContent = `Q${i + 1}: ${ansText}`;
    li.className = "mb-1";
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      state.idx = i;
      $("#reviewBlock")?.classList.add("hidden");
      renderQuestion();
    });
    list.appendChild(li);
  });
}

function exportResults() {
  const lines = [];
  lines.push("NextStep Navigator — Interest Quiz Results");
  lines.push(`Focus: ${state.interest}`);
  lines.push("");

  const ranked = toRanked(state.scores);
  lines.push("Streams:");
  ranked.forEach((r, i) => lines.push(`${i + 1}. ${r.stream}: ${r.score}`));
  lines.push("");

  const pack = QUIZ_DATA[state.interest];
  lines.push("Answers:");
  state.answers.forEach((ans, i) => {
    const txt = ans === null ? "(no answer)" : pack.questions[i].choices[ans].t;
    lines.push(`Q${i + 1}. ${pack.questions[i].q}`);
    lines.push(`   → ${txt}`);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Interest_Quiz_Results.txt";
  a.click();
  URL.revokeObjectURL(url);
}

/***********************
 * Wire UI
 ***********************/
function wire() {
  // Setup: interest chooser buttons
  $$("[data-interest]").forEach((btn) => {
    btn.addEventListener("click", () =>
      startQuiz(btn.getAttribute("data-interest"))
    );
  });

  // Nav
  $("#btnPrev")?.addEventListener("click", () => {
    if (state.idx > 0) {
      state.idx--;
      renderQuestion();
    }
  });

  $("#btnNext")?.addEventListener("click", () => {
    const pack = QUIZ_DATA[state.interest];
    if (!pack) return;
    if (state.idx < pack.total - 1) {
      if (state.answers[state.idx] === null) {
        alert("Please select an answer to continue.");
        return;
      }
      state.idx++;
      renderQuestion();
    } else {
      if (state.answers[state.idx] === null) {
        alert("Please select an answer to finish.");
        return;
      }
      showResults();
    }
  });

  // Review
  $("#btnReview")?.addEventListener("click", () => {
    paintReview();
    $("#reviewBlock")?.classList.toggle("hidden");
  });

  // Results actions
  $("#btnSave")?.addEventListener("click", () => {
    // save all shown recommendations
    $$("[data-bm]").forEach((btn) => {
      Bookmarks.toggle({
        id: btn.getAttribute("data-bm"),
        label: btn.getAttribute("data-label") || "Career",
        href: btn.getAttribute("data-href") || "#",
      });
      btn.classList.add("bookmark-active");
    });
    paintBookmarks("#bookmarkList");
    alert("Saved your recommended careers to Bookmarks.");
  });
  $("#btnExport")?.addEventListener("click", exportResults);
  $("#btnRetake")?.addEventListener("click", () => {
    $("#results")?.classList.add("hidden");
    $("#setup")?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Sidebar bookmarks/recents
  $("#exportBookmarks")?.addEventListener("click", () =>
    Bookmarks.export("Bookmarks.txt")
  );
  $("#clearBookmarks")?.addEventListener("click", () => {
    Bookmarks.clear();
    paintBookmarks("#bookmarkList");
    $$("[data-bm]").forEach((b) => b.classList.remove("bookmark-active"));
  });
}

/***********************
 * Init
 ***********************/
async function init() {
  utils.setYear("#year");
  paintHeaderProfile();

  // Clean & paint sidebars
  paintBookmarks("#bookmarkList");
  paintRecent("#recentList");

  try {
    CAREERS =
      (await utils.loadJSON("data/careers.json", {
        fallback: FALLBACK_CAREERS,
        onErrorSelector: "#resultCount",
      })) || [];
    const rawQuiz =
      (await utils.loadJSON("data/quiz.json", {
        fallback: FALLBACK_QUIZ,
        onErrorSelector: "#resultCount",
      })) || {};
    QUIZ_DATA = expandQuizAliases(rawQuiz);
  } catch (e) {
    console.error(e);
    alert(e.message || "Failed to load data.");
    return;
  }

  wire();

  // Optional deep links (e.g., ?mode=ugpg → preselect interest)
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");
  const map = { ugpg: "technology", pro: "business" };
  if (map[mode]) startQuiz(map[mode]);

  Recent.push("Opened Quiz", "quiz.html");
  paintRecent("#recentList");

  // Progress bar mutation glow (after wiring)
  const progressWrap = $("#progressWrap");
  const progressBar = $("#progressBar");
  if (progressBar && progressWrap) {
    const obs = new MutationObserver(() => {
      progressWrap.classList.remove("glow");
      void progressWrap.offsetWidth;
      progressWrap.classList.add("glow");
    });
    obs.observe(progressBar, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
