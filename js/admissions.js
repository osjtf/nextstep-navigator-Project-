/* Admissions & Coaching — Page JS (logic + animations) */
(function () {
  "use strict";

  const DATA_URL = "data/admissions.json";

  const $ = NSN.utils.$;
  const $$ = NSN.utils.$$;
  const esc = (s = "") => NSN.utils.escapeHTML(s);

  let DATA = { streams: [], timeline: [], interviews: [], resume: [] };

  const state = { ut: "", q: "", sort: "default" };

  /* ---------------- helpers ---------------- */
  const norm = (v) =>
    String(v || "")
      .trim()
      .toLowerCase();
  const slug = (v) =>
    String(v || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const makeKey = (prefix, raw, idx) => `${prefix}:${slug(raw || "") || idx}`;

  // Flexible userType match (handles: undefined, string, "a,b", ["a","b"], "*", "all")
  function matchesUserType(itemUT, selectedUT) {
    if (!selectedUT) return true;
    const sel = norm(selectedUT);
    if (itemUT == null || itemUT === "") return true; // generic items appear for all filters
    const list = Array.isArray(itemUT) ? itemUT : String(itemUT).split(/[,;|]/);
    const tokens = list.map(norm);
    if (tokens.includes("*") || tokens.includes("all")) return true;
    return tokens.includes(sel);
  }

  /* ---------------- Personalization header ---------------- */
  function paintHeader() {
    NSN.paintHeaderProfile("#helloUser", "#activeProfile", "#userTypeFilter");
  }

  /* ---------------- Utility: copy text ---------------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch (e) {
      console.warn("Clipboard failed", e);
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Copied to clipboard.");
    }
  }

  /* ---------------- Filters wiring ---------------- */
  function wireFilters() {
    $("#userTypeFilter")?.addEventListener("change", (e) => {
      state.ut = e.target.value || "";
      renderAll();
    });
    $("#search")?.addEventListener("input", (e) => {
      state.q = (e.target.value || "").toLowerCase();
      renderAll();
    });
    $("#sortBy")?.addEventListener("change", (e) => {
      state.sort = e.target.value || "default";
      renderAll();
    });
    $("#btnClearFilters")?.addEventListener("click", () => {
      state.ut = "";
      state.q = "";
      state.sort = "default";
      if ($("#userTypeFilter")) $("#userTypeFilter").value = "";
      if ($("#search")) $("#search").value = "";
      if ($("#sortBy")) $("#sortBy").value = "default";
      renderAll();
    });

    // quick anchors with nice scroll + recent tracking
    $$(".anchor").forEach((a) => {
      a.addEventListener("click", () => {
        NSN.pushRecent(
          a.textContent.trim(),
          a.getAttribute("href") || "admissions.html",
          "#recentList"
        );
      });
    });
  }

  /* ---------------- STREAMS ---------------- */
  function cardStream(s, idx) {
    const key = makeKey("stream", s.id ?? s.title, idx);
    const bmActive = NSN.isBookmarked(key) ? "bookmark-active" : "";
    const subj = (s.subjects || [])
      .map(
        (x) =>
          `<span class="chip"><i class="bi bi-journal-code"></i> ${esc(
            x
          )}</span>`
      )
      .join(" ");
    const tags = (s.tags || [])
      .map(
        (x) => `<span class="chip"><i class="bi bi-tag"></i> ${esc(x)}</span>`
      )
      .join(" ");
    const careers = (s.sampleCareers || [])
      .slice(0, 3)
      .map((c) => esc(c))
      .join(", ");
    return `
      <div class="col-12 col-md-6 col-xl-4 reveal">
        <article class="feature-card p-3 h-100 d-flex flex-column">
          <div class="d-flex align-items-start justify-content-between">
            <div class="icon-pill"><i class="bi ${
              s.icon || "bi-mortarboard"
            }"></i></div>
            <button class="btn btn-light btn-sm border-0 ${bmActive} heart-burst" title="Bookmark"
                    data-bm="${key}" data-label="${esc(
      s.title || "Stream"
    )}" data-href="admissions.html#stream">
              <i class="bi bi-heart-fill"></i>
            </button>
          </div>
          <h6 class="mt-2 mb-1">${esc(s.title || "Untitled")}</h6>
          <div class="small muted mb-2">${esc(s.description || "")}</div>
          <div class="d-flex flex-wrap gap-1 mb-2">${subj}</div>
          <div class="small mb-2"><i class="bi bi-briefcase me-1"></i><strong>Careers:</strong> ${
            careers || "—"
          }</div>
          <div class="d-flex flex-wrap gap-1">${tags}</div>
          <div class="mt-auto d-flex flex-wrap gap-2 pt-2">
            <a class="btn btn-outline-primary btn-sm" href="careers.html?industry=${encodeURIComponent(
              s.careerIndustry || ""
            )}" target="_self">
              <i class="bi bi-briefcase me-1"></i> Open Career Bank
            </a>
            ${
              s.checklistUrl
                ? `<a class="btn btn-light btn-sm" href="${esc(
                    s.checklistUrl
                  )}" target="_blank" rel="noreferrer"><i class="bi bi-download me-1"></i> Checklist</a>`
                : ""
            }
          </div>
        </article>
      </div>`;
  }

  function renderStreams() {
    const grid = $("#streamGrid");
    if (!grid) return;

    let rows = DATA.streams || [];
    if (state.ut)
      rows = rows.filter((x) => matchesUserType(x.userType, state.ut));
    if (state.q) {
      rows = rows.filter((x) => {
        const hay = `${x.title} ${x.description} ${(x.subjects || []).join(
          " "
        )} ${(x.tags || []).join(" ")} ${(x.sampleCareers || []).join(
          " "
        )}`.toLowerCase();
        return hay.includes(state.q);
      });
    }
    if (state.sort === "az")
      rows.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (state.sort === "za")
      rows.sort((a, b) => (b.title || "").localeCompare(a.title || ""));

    if (!rows.length) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">No streams match your filters.</div></div>`;
      return;
    }
    grid.innerHTML = rows.map(cardStream).join("");

    bindBookmarkClicks(grid);
  }

  /* ---------------- ABROAD TIMELINE ---------------- */
  function rowTimeline(t, idx) {
    const key = makeKey("abroad", t.id ?? t.title, idx);
    const bmActive = NSN.isBookmarked(key) ? "bookmark-active" : "";
    const docs = (t.documents || [])
      .map(
        (d) =>
          `<span class="chip"><i class="bi bi-file-earmark-text"></i> ${esc(
            d
          )}</span>`
      )
      .join(" ");
    return `
      <div class="feature-card p-3 reveal" data-stagger>
        <div class="d-flex align-items-start justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="count">${idx + 1}</div>
            <h6 class="mb-0">${esc(t.title || "Step")}</h6>
          </div>
          <button class="btn btn-light btn-sm border-0 ${bmActive} heart-burst" title="Bookmark"
                  data-bm="${key}" data-label="${esc(
      t.title || "Abroad step"
    )}" data-href="admissions.html#abroad">
            <i class="bi bi-heart-fill"></i>
          </button>
        </div>
        <div class="small muted mt-2 mb-2">${esc(t.subtitle || "")}</div>
        <ul class="mb-2">
          ${(t.actions || []).map((a) => `<li>${esc(a)}</li>`).join("")}
        </ul>
        ${docs ? `<div class="d-flex flex-wrap gap-1">${docs}</div>` : ""}
      </div>`;
  }

  function renderAbroad() {
    const box = $("#abroadTimeline");
    if (!box) return;

    let rows = DATA.timeline || [];
    if (state.ut)
      rows = rows.filter((x) => matchesUserType(x.userType, state.ut));
    if (state.q) {
      rows = rows.filter((x) => {
        const hay = `${x.title} ${x.subtitle} ${(x.actions || []).join(" ")} ${(
          x.documents || []
        ).join(" ")}`.toLowerCase();
        return hay.includes(state.q);
      });
    }

    if (!rows.length) {
      box.innerHTML = `<div class="alert alert-warning mb-0">No timeline items match your filters.</div>`;
      return;
    }
    box.innerHTML = rows.map(rowTimeline).join("");

    bindBookmarkClicks(box);
  }

  /* ---------------- INTERVIEW ---------------- */
  function cardInterview(iv, idx) {
    const baseId = iv.id || iv.title || `iv-${idx}`;
    const key = makeKey("interview", baseId, idx);
    const bmActive = NSN.isBookmarked(key) ? "bookmark-active" : "";
    const tips = (iv.tips || []).map((t) => `<li>${esc(t)}</li>`).join("");
    const qas = (iv.qas || [])
      .map(
        (q) => `
          <li class="mb-1">
            <strong>${esc(q.q)}</strong>
            <div class="small muted">Hint: ${esc(q.hint || "Think STAR")}</div>
            <div class="small">Sample: ${esc(q.sample || "")}</div>
          </li>`
      )
      .join("");
    const tags = (iv.tags || [])
      .map(
        (t) => `<span class="chip"><i class="bi bi-tag"></i> ${esc(t)}</span>`
      )
      .join(" ");
    return `
      <div class="col-12 col-md-6 reveal">
        <article class="feature-card p-3 h-100 d-flex flex-column">
          <div class="d-flex align-items-start justify-content-between">
            <div class="icon-pill"><i class="bi ${
              iv.icon || "bi-chat-square-quote"
            }"></i></div>
            <button class="btn btn-light btn-sm border-0 ${bmActive} heart-burst" title="Bookmark"
                    data-bm="${key}" data-label="${esc(
      iv.title || "Interview"
    )}" data-href="admissions.html#interview">
              <i class="bi bi-heart-fill"></i>
            </button>
          </div>
          <h6 class="mt-2 mb-1">${esc(iv.title || "Interview Tip")}</h6>
          <div class="small muted mb-2">${esc(iv.subtitle || "")}</div>
          ${
            tags ? `<div class="d-flex flex-wrap gap-1 mb-2">${tags}</div>` : ""
          }
          ${
            tips
              ? `<h6 class="mt-2">Tips</h6><ul class="mb-2">${tips}</ul>`
              : ""
          }
          ${
            qas
              ? `<h6 class="mt-1">Common questions</h6><ol class="mb-0">${qas}</ol>`
              : ""
          }
        </article>
      </div>`;
  }

  function renderInterview() {
    const grid = $("#interviewCards");
    if (!grid) return;

    let rows = DATA.interviews || [];
    if (state.ut)
      rows = rows.filter((x) => matchesUserType(x.userType, state.ut));
    if (state.q) {
      rows = rows.filter((x) => {
        const hay = `${x.title} ${x.subtitle} ${(x.tips || []).join(" ")} ${(
          x.tags || []
        ).join(" ")} ${(x.qas || [])
          .map((q) => q.q + " " + q.sample + " " + q.hint)
          .join(" ")}`.toLowerCase();
        return hay.includes(state.q);
      });
    }
    if (state.sort === "az")
      rows.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (state.sort === "za")
      rows.sort((a, b) => (b.title || "").localeCompare(a.title || ""));

    if (!rows.length) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">No interview items match your filters.</div></div>`;
      return;
    }
    grid.innerHTML = rows.map(cardInterview).join("");

    bindBookmarkClicks(grid);
  }

  /* ---------------- RESUME ---------------- */
  function sectionResume(r, idx) {
    const baseId = r.id || r.title || `resume-${idx}`;
    const key = makeKey("resume", baseId, idx);
    const bmActive = NSN.isBookmarked(key) ? "bookmark-active" : "";
    const dos = (r.dos || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const donts = (r.donts || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const ex = (r.examples || [])
      .map(
        (e) => `
        <div class="p-2 border rounded-3 mb-2 small bg-white">
          <div class="fw-semibold">${esc(e.heading || "Example")}</div>
          <div>${esc(e.text || "")}</div>
        </div>`
      )
      .join("");
    return `
      <div class="accordion-item reveal">
        <h2 class="accordion-header" id="h-${slug(baseId)}">
          <button class="accordion-button ${
            idx ? "collapsed" : ""
          }" type="button" data-bs-toggle="collapse" data-bs-target="#c-${slug(
      baseId
    )}" aria-expanded="${idx ? "false" : "true"}" aria-controls="c-${slug(
      baseId
    )}">
            ${esc(r.title || "Section")}
          </button>
        </h2>
        <div id="c-${slug(baseId)}" class="accordion-collapse collapse ${
      idx ? "" : "show"
    }" aria-labelledby="h-${slug(baseId)}">
          <div class="accordion-body">
            <div class="d-flex align-items-start justify-content-between mb-2">
              <div class="small muted">${esc(r.subtitle || "")}</div>
              <button class="btn btn-light btn-sm border-0 ${bmActive} heart-burst" title="Bookmark"
                      data-bm="${key}" data-label="${esc(
      r.title || "Resume"
    )}" data-href="admissions.html#resume">
                <i class="bi bi-heart-fill"></i>
              </button>
            </div>
            ${r.summary ? `<p class="mb-2">${esc(r.summary)}</p>` : ""}
            <div class="row g-3">
              <div class="col-md-6">
                ${dos ? `<h6>Do</h6><ul class="mb-2">${dos}</ul>` : ""}
              </div>
              <div class="col-md-6">
                ${donts ? `<h6>Don't</h6><ul class="mb-2">${donts}</ul>` : ""}
              </div>
            </div>
            ${ex ? `<h6 class="mt-2">Examples</h6>${ex}` : ""}
          </div>
        </div>
      </div>`;
  }

  function renderResume() {
    const acc = $("#resumeAccordion");
    if (!acc) return;

    let rows = DATA.resume || [];
    if (state.ut)
      rows = rows.filter((x) => matchesUserType(x.userType, state.ut));
    if (state.q) {
      rows = rows.filter((x) => {
        const hay = `${x.title} ${x.subtitle} ${x.summary} ${(x.dos || []).join(
          " "
        )} ${(x.donts || []).join(" ")} ${(x.examples || [])
          .map((e) => e.heading + " " + e.text)
          .join(" ")}`.toLowerCase();
        return hay.includes(state.q);
      });
    }
    if (state.sort === "az")
      rows.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (state.sort === "za")
      rows.sort((a, b) => (b.title || "").localeCompare(a.title || ""));

    if (!rows.length) {
      acc.innerHTML = `<div class="p-3"><div class="alert alert-warning mb-0">No resume sections match your filters.</div></div>`;
      return;
    }
    acc.innerHTML = rows.map(sectionResume).join("");

    bindBookmarkClicks(acc);
  }

  /* ------ Bookmark binding (single source of truth) ------ */
  function bindBookmarkClicks(rootEl) {
    $$("[data-bm]", rootEl).forEach((btn) => {
      btn.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          const id = btn.getAttribute("data-bm");
          const label = btn.getAttribute("data-label") || "Item";
          const href = btn.getAttribute("data-href") || "#";
          // Persist + repaint sidebar
          NSN.toggleBookmark({ id, label, href }, "#bookmarkList");
          // Toggle all visuals for same id
          $$(`[data-bm="${CSS.escape(id)}"]`).forEach((b) =>
            b.classList.toggle("bookmark-active")
          );
          // tiny burst animation
          btn.classList.remove("burst");
          void btn.offsetWidth;
          btn.classList.add("burst");
        },
        { once: false }
      );
    });
  }

  /* ---------------- SHARE BUTTONS ---------------- */
  function wireShareButtons() {
    function tryShare(title, urlHash) {
      const url = location.origin
        ? location.origin + location.pathname + urlHash
        : location.href.split("#")[0] + urlHash;
      const text = `${title} — NextStep Navigator\n${url}`;
      if (navigator.share) {
        navigator.share({ title, text, url }).catch(() => {
          /* user canceled */
        });
      } else {
        copyText(text);
      }
    }
    $("#shareStream")?.addEventListener("click", () =>
      tryShare("Stream Selection", "#stream")
    );
    $("#shareAbroad")?.addEventListener("click", () =>
      tryShare("Study Abroad Guidelines", "#abroad")
    );
    $("#shareInterview")?.addEventListener("click", () =>
      tryShare("Interview Tips", "#interview")
    );
    $("#shareResume")?.addEventListener("click", () =>
      tryShare("Resume Guidelines", "#resume")
    );
  }

  /* ---------------- Bulk save & export ---------------- */
  function wireActions() {
    $("#btnSaveAll")?.addEventListener("click", () => {
      // Save visible items from all sections
      [
        "#streamGrid",
        "#abroadTimeline",
        "#resumeAccordion",
        "#interviewCards",
      ].forEach((sel) => {
        $$(sel + " [data-bm]").forEach((btn) => {
          const id = btn.getAttribute("data-bm");
          NSN.toggleBookmark(
            {
              id,
              label: btn.getAttribute("data-label") || "Item",
              href: btn.getAttribute("data-href") || "#",
            },
            "#bookmarkList"
          );
          $$(`[data-bm="${CSS.escape(id)}"]`).forEach((b) =>
            b.classList.add("bookmark-active")
          );
        });
      });
      alert("Saved all visible sections to Bookmarks.");
    });

    $("#btnExport")?.addEventListener("click", () => {
      const lines = [];
      lines.push("NextStep Navigator — Admissions & Coaching");
      lines.push(`User type filter: ${state.ut || "All"}`);
      lines.push("");
      lines.push("[Stream Selection]");
      $$("#streamGrid h6").forEach((h) =>
        lines.push("- " + h.textContent.trim())
      );
      lines.push("");
      lines.push("[Study Abroad Steps]");
      $$("#abroadTimeline .feature-card h6").forEach((h) =>
        lines.push("- " + h.textContent.trim())
      );
      lines.push("");
      lines.push("[Resume Sections]");
      $$("#resumeAccordion .accordion-button").forEach((b) =>
        lines.push("- " + b.textContent.trim())
      );
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Admissions_Notes.txt";
      a.click();
      URL.revokeObjectURL(url);
    });

    $("#exportBookmarks")?.addEventListener("click", () =>
      NSN.exportBookmarks("Admissions_Bookmarks.txt")
    );
    $("#clearBookmarks")?.addEventListener("click", () =>
      NSN.clearBookmarks("#bookmarkList")
    );
  }

  /* ---------------- Render all ---------------- */
  function renderAll() {
    renderStreams();
    renderAbroad();
    renderInterview();
    renderResume();

    const total =
      $$("#streamGrid [data-bm]").length +
      $$("#abroadTimeline [data-bm]").length +
      $$("#interviewCards [data-bm]").length +
      $$("#resumeAccordion [data-bm]").length;

    const info = $("#resultInfo");
    if (info)
      info.textContent = total
        ? `Showing ${total} actionable items`
        : "No items";

    // refresh reveals on newly injected nodes
    requestAnimationFrame(setupReveals);
  }

  /* ---------------- Init ---------------- */
  async function init() {
    NSN.utils.setYear("#year");
    paintHeader();

    // sidebars
    NSN.getRecent();
    NSN.paintRecent("#recentList");
    NSN.paintBookmarks("#bookmarkList");

    try {
      const raw = await NSN.loadJSON(DATA_URL, {
        fallback: null,
        onErrorMessageSelector: "#resultInfo",
      });
      DATA = Object.assign(
        { streams: [], timeline: [], interviews: [], resume: [] },
        raw || {}
      );
    } catch (e) {
      console.error(e);
      alert(
        "Failed to load admissions.json. Ensure you are serving over http(s) and the path is correct."
      );
      return;
    }

    wireFilters();
    wireShareButtons();
    wireActions();

    renderAll();

    NSN.pushRecent(
      "Opened Admissions & Coaching",
      "admissions.html",
      "#recentList"
    );

    // hash deep link
    if (location.hash) {
      const id = location.hash;
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // interactions
    setupStickyNav();
    wireRipples();
    observeAnchors();
    sprinkleSparkles();
  }

  document.addEventListener("DOMContentLoaded", init);

  /* =========================
     Animations / Interactions
     ========================= */

     
  let revealObserver;
  function setupReveals() {
    if (revealObserver) revealObserver.disconnect();
    const nodes = $$(".reveal:not(.revealed)");
    if (!nodes.length) return;
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const baseDelay = el.hasAttribute("data-stagger") ? 60 : 0; // ms
            const idx = el.parentElement
              ? [...el.parentElement.children].indexOf(el)
              : 0;
            const delay = baseDelay ? idx * baseDelay : 0;
            setTimeout(() => el.classList.add("revealed"), delay);
            revealObserver.unobserve(el);
          }
        });
      },
      { rootMargin: "-10% 0px -5% 0px", threshold: 0.05 }
    );
    nodes.forEach((n) => revealObserver.observe(n));
  }

  function setupStickyNav() {
    const nav = document.querySelector(".navbar");
    if (!nav) return;
    const onScroll = () => {
      window.scrollY > 6
        ? nav.classList.add("is-stuck")
        : nav.classList.remove("is-stuck");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function wireRipples() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty("--r-x", x + "px");
      btn.style.setProperty("--r-y", y + "px");
      btn.classList.add("rippling");
      setTimeout(() => btn.classList.remove("rippling"), 650);
    });
  }

  function observeAnchors() {
    const list = $("#inpageLinks");
    if (!list) return;
    const links = [...list.querySelectorAll(".anchor")];
    const sections = links
      .map((a) => document.querySelector(a.getAttribute("href") || ""))
      .filter(Boolean);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          const id = "#" + ent.target.id;
          const link = links.find((a) => a.getAttribute("href") === id);
          if (!link) return;
          if (ent.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-50% 0px -45% 0px", threshold: 0.01 }
    );
    sections.forEach((el) => io.observe(el));

    // smooth scroll + pulse
    links.forEach((a) => {
      a.addEventListener("click", (ev) => {
        const id = a.getAttribute("href") || "";
        if (!id.startsWith("#")) return;
        ev.preventDefault();
        const target = document.querySelector(id);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        const panel = target.querySelector(".panel");
        if (panel) {
          panel.classList.remove("section-pulse");
          void panel.offsetWidth;
          panel.classList.add("section-pulse");
          setTimeout(() => panel.classList.remove("section-pulse"), 700);
        }
        history.replaceState(null, "", id);
      });
    });
  }

  function sprinkleSparkles() {
    const c = document.querySelector(".sparkles");
    if (!c || c.dataset.ready) return;
    c.dataset.ready = "1";
    const count = 14;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("i");
      dot.style.left = Math.random() * 100 + "%";
      dot.style.top = Math.random() * 100 + "%";
      dot.style.animationDuration = 6 + Math.random() * 6 + "s";
      c.appendChild(dot);
    }
    document.addEventListener(
      "mousemove",
      (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 8;
        const y = (e.clientY / window.innerHeight - 0.5) * 6;
        c.style.transform = `translate(${x}px, ${y}px)`;
      },
      { passive: true }
    );
  }

  // prime reveals for any static nodes present at load
  setupReveals();
})();
