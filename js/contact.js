(function () {
  "use strict";
  const $ = NSN.utils.$;
  const $$ = NSN.utils.$$;

  function copyToClipboard(text) {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      new bootstrap.Toast($("#copyToast")).show();
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
        new bootstrap.Toast($("#copyToast")).show();
      } finally {
        document.body.removeChild(t);
      }
    }
  }

  function switchMap(key) {
    const map = $("#mapFrame");
    if (!map) return;
    const src =
      key === "tahrir"
        ? "https://www.google.com/maps?q=Al-Tahrir%20Square%20Sana%27a%20Yemen&output=embed"
        : "https://www.google.com/maps?q=Hadda%20Street%20Sana%27a%20Yemen&output=embed";
    map.src = src;

    // mark active
    $$("[data-map]").forEach((b) => b.classList.remove("active"));
    const btn = document.querySelector(`[data-map="${key}"]`);
    if (btn) btn.classList.add("active");
  }

  function wire() {
    // footer year & header personalization
    NSN.utils.setYear("#year");
    NSN.paintHeaderProfile("#helloUser", "#activeProfile"); // (active not present here)

    // sidebars
    NSN.getRecent();
    NSN.paintRecent("#recentList");
    NSN.paintBookmarks("#bookmarkList");
    $("#exportBookmarks")?.addEventListener("click", () =>
      NSN.exportBookmarks("Bookmarks.txt")
    );
    $("#clearBookmarks")?.addEventListener("click", () =>
      NSN.clearBookmarks("#bookmarkList")
    );

    // clipboard
    $$("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () =>
        copyToClipboard(btn.getAttribute("data-copy"))
      );
    });

    // map switchers
    $$("[data-map]").forEach((btn) => {
      btn.addEventListener("click", () =>
        switchMap(btn.getAttribute("data-map"))
      );
    });

    // track visit
    NSN.pushRecent("Opened Contact (Sana’a)", "contact.html", "#recentList");
  }

  document.addEventListener("DOMContentLoaded", wire);
})();

//for the animations

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

  /* ---- Avatar fade-in once images load ---- */
  $$("img.avatar").forEach((img) => {
    if (img.complete) {
      img.classList.add("is-ready");
    } else {
      img.addEventListener("load", () => img.classList.add("is-ready"), {
        once: true,
      });
    }
  });

  /* ---- Office switch: map cross-fade + address highlight ---- */
  const map = $("#mapFrame");
  const officeBtns = $$("button[data-map]");
  const addrs = {
    hadda: {
      src: "https://www.google.com/maps?q=Hadda%20Street%20Sana%27a%20Yemen&output=embed",
      card: $("#addr-hadda"),
    },
    tahrir: {
      src: "https://www.google.com/maps?q=Al-Tahrir%20Square%20Sana%27a%20Yemen&output=embed",
      card: $("#addr-tahrir"),
    },
  };
  officeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      officeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.dataset.map;
      const info = addrs[key];
      if (!info) return;

      // cross-fade map
      map.classList.add("is-switching");
      // small delay so opacity animates before src swap
      setTimeout(() => {
        map.src = info.src;
      }, 120);
      map.addEventListener("load", () => map.classList.remove("is-switching"), {
        once: true,
      });

      // pulse highlight on the selected address card
      info.card?.classList.remove("address-highlight");
      void info.card?.offsetWidth;
      info.card?.classList.add("address-highlight");
    });
  });

  /* ---- Pop-in for team cards when scrolled into view ---- */
  const team = $("#teamGrid");
  if (team) {
    const ioTeam = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const col = e.target;
            col.style.animationDelay =
              ([...team.children].indexOf(col) % 8) * 0.05 + "s";
            col.classList.add("pop-in");
            ioTeam.unobserve(col);
          }
        });
      },
      { threshold: 0.12 }
    );
    [...team.querySelectorAll(".col-md-6, .col-xl-4")].forEach((col) =>
      ioTeam.observe(col)
    );
  }

  /* ---- Enhance copy buttons: ripple is already wired ---- */
  $$("[data-copy]").forEach((btn) => {
    btn.setAttribute("title", "Copy to clipboard");
  });
})();
