const $ = NSN.utils.$;
const $$ = NSN.utils.$$;

/* -----------------------------
   Clock (HH:MM:SS)
----------------------------- */
function startClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const tick = () => {
    el.textContent = fmt.format(new Date());
  };
  tick();
  setInterval(tick, 1000);
}

/* -----------------------------
   Geolocation (coords only)
----------------------------- */
function initGeo() {
  const el = document.getElementById("geo");
  if (!el) return;
  if (!navigator.geolocation) {
    el.textContent = "Geolocation not supported";
    el.classList.remove("d-none");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      el.textContent = `Lat ${latitude.toFixed(3)}, Lng ${longitude.toFixed(
        3
      )}`;
      el.classList.remove("d-none");
    },
    () => {
      el.textContent = "Location: permission denied";
      el.classList.remove("d-none");
    },
    { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
  );
}

/* -----------------------------
   Visitor Counter (local)
   Single writer: update + animate
----------------------------- */
function getNumeric(text) {
  // strip anything that's not a digit
  const n = parseInt(String(text).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function animateNumber(el, from, to, dur = 900) {
  if (!el) return;
  if (from === to) {
    el.textContent = to.toLocaleString();
    return;
  }

  const start = performance.now();
  const ease = (p) => 1 - Math.pow(1 - p, 3); // easeOutCubic

  function frame(t) {
    const p = Math.min(1, (t - start) / dur);
    const val = Math.round(from + (to - from) * ease(p));
    el.textContent = val.toLocaleString();
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function bumpAndPaintVisitor() {
  const el = document.getElementById("visitorCount");
  if (!el) return;

  const key = "nsn_visits";
  let visits = parseInt(localStorage.getItem(key) || "0", 10);
  visits += 1;
  localStorage.setItem(key, String(visits));

  // Current visible number becomes the animation start
  const currentShown = getNumeric(el.textContent);
  // Write target only to a dataset; text is controlled by the animator
  el.dataset.countTo = String(visits);

  animateNumber(el, currentShown, visits, 900);
}

/* -----------------------------
   Personalization (session)
----------------------------- */
function applyProfile() {
  const nameEl = document.getElementById("username");
  const typeEl = document.getElementById("userType");
  if (!nameEl || !typeEl) return;

  const name = nameEl.value.trim();
  const type = typeEl.value;

  if (name) sessionStorage.setItem("nsn_name", name);
  else sessionStorage.removeItem("nsn_name");

  if (type) sessionStorage.setItem("nsn_type", type);
  else sessionStorage.removeItem("nsn_type");

  paintGreeting();
  paintTailored();
  NSN.paintHeaderProfile("#helloUser", "#activeProfile", "#userTypeFilter");
}

function paintGreeting() {
  const name = sessionStorage.getItem("nsn_name") || "";
  const type = sessionStorage.getItem("nsn_type") || "";
  const g = document.getElementById("greeting");
  if (!g) return;

  let title = "";
  if (type === "student") title = "Future Scholar";
  else if (type === "graduate") title = "Rising Graduate";
  else if (type === "professional") title = "Career Trailblazer";

  if (name || type) {
    g.innerHTML = `
      <div class="alert alert-info mt-3 mb-0 border-0">
        <strong>Hello${name ? `, ${NSN.utils.escapeHTML(name)}` : ""}!</strong>
        ${title ? ` Welcome, <em>${title}</em>.` : ""}
        Your experience is now tailored to <strong>${type || "—"}</strong>.
      </div>`;
  } else {
    g.innerHTML = `<div class="text-muted small mt-2">Tip: Enter your name and choose a user type to personalize.</div>`;
  }
}

/* -----------------------------
   Tailored menu
----------------------------- */
const TAILORED = {
  student: [
    {
      title: "Career Bank",
      icon: "bi-briefcase",
      href: "careers.html",
      desc: "Explore careers aligned with school subjects.",
    },
    {
      title: "Interest Quiz",
      icon: "bi-ui-checks-grid",
      href: "quiz.html",
      desc: "Discover your strengths & streams.",
    },
    {
      title: "Study Tips",
      icon: "bi-mortarboard",
      href: "admissions.html#stream",
      desc: "Choose streams post-10th with confidence.",
    },
    {
      title: "Multimedia",
      icon: "bi-camera-reels",
      href: "multimedia.html?cat=motivation",
      desc: "Talks & podcasts for students.",
    },
    {
      title: "Success Stories",
      icon: "bi-stars",
      href: "stories.html?domain=engineering",
      desc: "Inspiration from real journeys.",
    },
    {
      title: "Resource Library",
      icon: "bi-journal-text",
      href: "resources.html?type=checklists",
      desc: "Checklists & guides for exams.",
    },
  ],
  graduate: [
    {
      title: "Career Bank",
      icon: "bi-briefcase",
      href: "careers.html?filter=graduate",
      desc: "Roles, skills, and salary insights.",
    },
    {
      title: "Interest Quiz",
      icon: "bi-ui-checks-grid",
      href: "quiz.html?mode=ugpg",
      desc: "Map interests to majors.",
    },
    {
      title: "Interview Tips",
      icon: "bi-patch-question",
      href: "admissions.html#interview",
      desc: "Ace your first interviews.",
    },
    {
      title: "Resume Guidelines",
      icon: "bi-file-earmark-person",
      href: "admissions.html#resume",
      desc: "Craft a standout resume.",
    },
    {
      title: "Multimedia",
      icon: "bi-camera-reels",
      href: "multimedia.html?cat=internships",
      desc: "Internship advice & journeys.",
    },
    {
      title: "Resource Library",
      icon: "bi-journal-text",
      href: "resources.html?type=ebooks",
      desc: "eBooks, templates & articles.",
    },
  ],
  professional: [
    {
      title: "Career Bank",
      icon: "bi-briefcase",
      href: "careers.html?filter=professional",
      desc: "Upskilling paths & transitions.",
    },
    {
      title: "Interest Quiz",
      icon: "bi-ui-checks-grid",
      href: "quiz.html?mode=pro",
      desc: "Find adjacent career moves.",
    },
    {
      title: "Interview Tips",
      icon: "bi-chat-square-quote",
      href: "admissions.html#interview",
      desc: "Senior interview strategies.",
    },
    {
      title: "Resume Guidelines",
      icon: "bi-file-earmark-person",
      href: "admissions.html#resume",
      desc: "Reframe experience for pivots.",
    },
    {
      title: "Multimedia",
      icon: "bi-camera-reels",
      href: "multimedia.html?cat=roles",
      desc: "Day-in-the-life videos.",
    },
    {
      title: "Resource Library",
      icon: "bi-journal-text",
      href: "resources.html?type=webinars",
      desc: "Webinars & checklists.",
    },
  ],
};

function cardHTML(item) {
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <a class="feature-card d-block p-3 h-100 pointer quick-link" data-href="${
        item.href
      }">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold">${NSN.utils.escapeHTML(item.title)}</span>
          <i class="bi ${item.icon} fs-4 text-primary"></i>
        </div>
        <p class="small text-muted mb-0">${NSN.utils.escapeHTML(item.desc)}</p>
      </a>
    </div>`;
}

function paintTailored() {
  const grid = document.getElementById("tailoredGrid");
  const who = document.getElementById("whoLabel");
  if (!grid || !who) return;

  const type = sessionStorage.getItem("nsn_type");
  grid.innerHTML = "";
  if (!type) {
    who.textContent = "Choose your user type to see relevant content.";
    return;
  }
  const list = TAILORED[type] || [];
  who.textContent = `Showing recommendations for: ${
    type.charAt(0).toUpperCase() + type.slice(1)
  }`;
  grid.innerHTML = list.map(cardHTML).join("");
  bindQuickLinks();
}

/* -----------------------------
   Recents / navigation
----------------------------- */
function bindQuickLinks() {
  $$(".quick-link").forEach((node) => {
    if (node.dataset.bound === "1") return;
    node.dataset.bound = "1";
    node.addEventListener("click", (e) => {
      e.preventDefault();
      const href = node.getAttribute("data-href");
      const label =
        node.querySelector(".fw-bold")?.textContent?.trim() || href || "Link";
      NSN.pushRecent(label, href, "#recentList");
      window.location.href = href;
    });
  });
}

/* -----------------------------
   Session reset
----------------------------- */
function resetSession() {
  sessionStorage.removeItem("nsn_name");
  sessionStorage.removeItem("nsn_type");
  const nameEl = document.getElementById("username");
  const typeEl = document.getElementById("userType");
  if (nameEl) nameEl.value = "";
  if (typeEl) typeEl.value = "";
  paintGreeting();
  paintTailored();
  NSN.paintHeaderProfile("#helloUser", "#activeProfile", "#userTypeFilter");
}

/* -----------------------------
   Auth buttons (dummy)
----------------------------- */
function bindAuth() {
  const login = document.getElementById("btnLogin");
  const signup = document.getElementById("btnSignup");
  if (login)
    login.addEventListener("click", () =>
      alert("This is a static prototype.\nLogin is non-functional by design.")
    );
  if (signup)
    signup.addEventListener("click", () =>
      alert("This is a static prototype.\nSignup is non-functional by design.")
    );
}

/* -----------------------------
   Init
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  NSN.utils.setYear("#year");

  // Prefill form from session (if any)
  const name = sessionStorage.getItem("nsn_name") || "";
  const type = sessionStorage.getItem("nsn_type") || "";
  const nameEl = document.getElementById("username");
  const typeEl = document.getElementById("userType");
  if (nameEl && name) nameEl.value = name;
  if (typeEl && type) typeEl.value = type;

  // Counter & sensors
  bumpAndPaintVisitor(); // single writer controls text
  startClock();
  initGeo();

  // UI blocks
  paintGreeting();
  paintTailored();

  // Shared: sanitize & paint recent/bookmarks
  NSN.getRecent();
  NSN.paintRecent("#recentList");
  NSN.paintBookmarks("#bookmarkList");

  // Bind actions
  bindQuickLinks();
  bindAuth();

  // Buttons
  document
    .getElementById("applyProfile")
    ?.addEventListener("click", applyProfile);
  document.getElementById("exportBookmarks")?.addEventListener("click", (e) => {
    e.preventDefault();
    NSN.exportBookmarks("NextStep_Navigator_Bookmarks.txt");
  });
  document.getElementById("clearSession")?.addEventListener("click", (e) => {
    e.preventDefault();
    resetSession();
  });

  // Track page open
  NSN.pushRecent("Opened Home", "index.html", "#recentList");
});

/* -----------------------------
   Light-touch animations
----------------------------- */
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  // Scroll reveal with stagger
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

  // Quick-link press feedback (visual only)
  $$(".quick-link").forEach((card) => {
    card.addEventListener(
      "click",
      () => {
        card.style.transform = "translateY(1px) scale(.995)";
        setTimeout(() => (card.style.transform = ""), 120);
      },
      { passive: true }
    );
  });

  // Button ripple
  function makeRipple(e) {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    btn.style.setProperty("--rx", x - r.width / 2 + "px");
    btn.style.setProperty("--ry", y - r.height / 2 + "px");
    btn.classList.remove("ripple--animating");
    void btn.offsetWidth;
    btn.classList.add("ripple--animating");
    setTimeout(() => btn.classList.remove("ripple--animating"), 650);
  }
  $$(".ripple").forEach((b) => b.addEventListener("click", makeRipple));

  // Auto-reveal tailored cards when injected
  const tailoredGrid = $("#tailoredGrid");
  if (tailoredGrid) {
    const mo = new MutationObserver(() => {
      $$(".feature-card", tailoredGrid).forEach((c, i) => {
        c.classList.add("reveal");
        c.dataset.delay = (i % 6) * 0.06;
        io.observe(c);
      });
    });
    mo.observe(tailoredGrid, { childList: true, subtree: true });
  }
})();
