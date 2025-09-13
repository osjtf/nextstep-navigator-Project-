(function () {
  "use strict";
  const $ = NSN.utils.$;
  const $$ = NSN.utils.$$;
  const esc = NSN.utils.escapeHTML;

  // Personalize header + sidebars
  function paintHeaderProfile() {
    NSN.paintHeaderProfile("#helloUser", "#activeProfile"); // (active not present here; harmless)
  }

  // Character counter + bar
  function updateCounter() {
    const ta = $("#fbMessage");
    const cc = $("#charCount");
    const bar = $("#charBarFill");
    if (!ta || !cc || !bar) return;
    const max = ta.getAttribute("maxlength")
      ? Number(ta.getAttribute("maxlength"))
      : 1000;
    const len = ta.value.length;
    cc.textContent = len;
    const pct = Math.min(100, Math.round((len / max) * 100));
    bar.style.width = pct + "%";
    $("#msgError").style.display = len >= 10 && len <= max ? "none" : "block";
  }

  // Validation helpers
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }
  function validate() {
    const name = $("#fbName"),
      email = $("#fbEmail"),
      msg = $("#fbMessage");
    let ok = true;

    // Name
    if (!name.value.trim()) {
      name.classList.add("is-invalid");
      name.classList.remove("is-valid");
      ok = false;
    } else {
      name.classList.remove("is-invalid");
      name.classList.add("is-valid");
    }

    // Email
    if (!validEmail(email.value)) {
      email.classList.add("is-invalid");
      email.classList.remove("is-valid");
      ok = false;
    } else {
      email.classList.remove("is-invalid");
      email.classList.add("is-valid");
    }

    // Message
    const len = msg.value.trim().length;
    if (len < 10 || len > 1000) {
      msg.classList.add("is-invalid");
      msg.classList.remove("is-valid");
      ok = false;
    } else {
      msg.classList.remove("is-invalid");
      msg.classList.add("is-valid");
    }

    // Honeypot (must be empty)
    const hp = $("#fbCompany");
    if (hp && hp.value.trim()) ok = false;

    return ok;
  }

  function getPayload() {
    return {
      name: $("#fbName").value.trim(),
      email: $("#fbEmail").value.trim(),
      role: $("#fbRole").value,
      category: $("#fbCategory").value,
      subject: $("#fbSubject").value.trim(),
      message: $("#fbMessage").value.trim(),
      ts: new Date().toISOString(),
    };
  }

  function setPayload(p) {
    $("#fbName").value = p.name || "";
    $("#fbEmail").value = p.email || "";
    $("#fbRole").value = p.role || "";
    $("#fbCategory").value = p.category || "";
    $("#fbSubject").value = p.subject || "";
    $("#fbMessage").value = p.message || "";
    updateCounter();
  }

  function payloadToTxt(p) {
    const lines = [];
    lines.push("NextStep Navigator — Feedback");
    lines.push(`Timestamp: ${new Date(p.ts || Date.now()).toString()}`);
    lines.push("");
    lines.push(`Name: ${p.name || ""}`);
    lines.push(`Email: ${p.email || ""}`);
    lines.push(`Role: ${p.role || ""}`);
    lines.push(`Category: ${p.category || ""}`);
    lines.push(`Subject: ${p.subject || ""}`);
    lines.push("");
    lines.push("Message:");
    lines.push(p.message || "");
    return lines.join("\n");
  }

  function exportTxt(p, filename = "Feedback.txt") {
    const blob = new Blob([payloadToTxt(p)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearForm() {
    $("#feedbackForm").reset();
    $$(".is-valid").forEach((n) => n.classList.remove("is-valid"));
    $$(".is-invalid").forEach((n) => n.classList.remove("is-invalid"));
    updateCounter();
  }

  function saveDraft() {
    const p = getPayload();
    localStorage.setItem("nsn_feedback_draft", JSON.stringify(p));
    new bootstrap.Toast($("#draftToast")).show();
  }

  function loadDraft() {
    try {
      const txt = localStorage.getItem("nsn_feedback_draft");
      if (!txt) {
        alert("No draft found.");
        return;
      }
      const p = JSON.parse(txt);
      setPayload(p);
    } catch {
      alert("Could not load draft.");
    }
  }

  // Preview modal
  function openPreview() {
    const p = getPayload();
    $("#pvName").textContent = p.name || "—";
    $("#pvEmail").textContent = p.email || "—";
    $("#pvRole").textContent = p.role
      ? p.role[0].toUpperCase() + p.role.slice(1)
      : "—";
    $("#pvCategory").textContent = p.category || "—";
    $("#pvSubject").textContent = p.subject || "—";
    $("#pvMessage").textContent = p.message || "";
    const modal = new bootstrap.Modal("#previewModal");
    modal.show();
    $("#pvExport").onclick = () => exportTxt(p, "Feedback_Preview.txt");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      updateCounter();
      alert("Please fix the highlighted fields.");
      return;
    }
    // Simulated success — no network calls
    new bootstrap.Toast($("#okToast")).show();

    // Recently Viewed entry
    NSN.pushRecent(
      "Submitted Feedback (Simulated)",
      "feedback.html",
      "#recentList"
    );

    // Optional: clear validation states
    $$(".is-valid").forEach((n) => n.classList.remove("is-valid"));
    $$(".is-invalid").forEach((n) => n.classList.remove("is-invalid"));
  }

  function wire() {
    NSN.utils.setYear("#year");
    paintHeaderProfile();

    // Sidebars
    NSN.getRecent();
    NSN.paintRecent("#recentList");
    NSN.paintBookmarks("#bookmarkList");
    $("#exportBookmarks")?.addEventListener("click", () =>
      NSN.exportBookmarks("Bookmarks.txt")
    );
    $("#clearBookmarks")?.addEventListener("click", () =>
      NSN.clearBookmarks("#bookmarkList")
    );

    // Form
    $("#fbMessage")?.addEventListener("input", updateCounter);
    $("#fbName")?.addEventListener("blur", validate);
    $("#fbEmail")?.addEventListener("blur", validate);
    $("#fbMessage")?.addEventListener("blur", validate);

    $("#btnPreview")?.addEventListener("click", openPreview);
    $("#btnSubmit")?.addEventListener("click", () =>
      $("#feedbackForm").requestSubmit()
    );
    $("#feedbackForm")?.addEventListener("submit", handleSubmit);

    $("#btnSaveDraft")?.addEventListener("click", saveDraft);
    $("#btnLoadDraft")?.addEventListener("click", loadDraft);
    $("#btnExport")?.addEventListener("click", () =>
      exportTxt(getPayload(), "Feedback.txt")
    );
    $("#btnClear")?.addEventListener("click", clearForm);
    $("#btnPrint")?.addEventListener("click", () => window.print());

    // Prefill role from session (nice touch)
    const tp = sessionStorage.getItem("nsn_type") || "";
    if (tp && !$("#fbRole").value) $("#fbRole").value = tp;

    // Initial
    updateCounter();
    NSN.pushRecent("Opened Feedback", "feedback.html", "#recentList");
  }

  document.addEventListener("DOMContentLoaded", wire);
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

  /* ---- Animate FAQ items when opened (subtle) ---- */
  $$(".accordion-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      // small emphasis after opening
      setTimeout(() => {
        const body = btn
          .closest(".accordion-item")
          ?.querySelector(".accordion-collapse.show .accordion-body");
        if (body) {
          body.animate([{ opacity: 0.8 }, { opacity: 1 }], {
            duration: 180,
            easing: "ease-out",
          });
        }
      }, 180);
    });
  });

  /* ---- Smooth show of form sections when panels toggle (if your JS toggles classes) ---- */
  const form = $("#feedbackForm");
  if (form && !form.classList.contains("in")) {
    io.observe(form);
  }

  /* ---- Char bar anim handled by CSS transition on width; nothing else needed ---- */
})();
