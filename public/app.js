/* RamonMods — interações da home (nav, reveal, scrollytelling, FAQ) */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal ao entrar na tela ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".lp-reveal"));

  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.setAttribute("data-visible", "true"); });
  } else {
    doc.setAttribute("data-reveal-ready", "");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-visible", "true");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- tema da nav conforme a seção sob ela ---------- */
  var nav = document.querySelector(".lp-nav");
  var themed = Array.prototype.slice.call(document.querySelectorAll("main > section, body > footer"));

  function syncNavTheme() {
    if (!nav) return;
    var point = nav.getBoundingClientRect().top + nav.offsetHeight / 2;
    var theme = "light";
    for (var i = 0; i < themed.length; i++) {
      var rect = themed[i].getBoundingClientRect();
      if (rect.top <= point && rect.bottom > point) {
        theme = themed[i].getAttribute("data-theme") || "light";
        break;
      }
    }
    if (nav.getAttribute("data-theme") !== theme) nav.setAttribute("data-theme", theme);
  }

  /* ---------- scrollytelling "como funciona" ---------- */
  var steps = Array.prototype.slice.call(document.querySelectorAll(".lp-story__step"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".lp-story__tab"));
  var scenes = Array.prototype.slice.call(document.querySelectorAll(".rm-scene[data-scene]"));
  var progress = document.getElementById("story-progress");
  var counter = document.getElementById("story-count");
  var activeStep = -1;

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function setStep(index) {
    if (index < 0 || index === activeStep) return;
    activeStep = index;

    tabs.forEach(function (tab, i) {
      if (i === index) tab.setAttribute("aria-current", "step");
      else tab.removeAttribute("aria-current");
    });

    scenes.forEach(function (scene, i) {
      scene.hidden = i !== index;
    });

    if (progress) progress.style.width = ((index + 1) / steps.length) * 100 + "%";
    if (counter) counter.textContent = pad(index + 1) + " / " + pad(steps.length);
  }

  function syncStep() {
    if (!steps.length) return;
    var middle = window.innerHeight * 0.5;
    var best = 0;
    var bestDist = Infinity;
    steps.forEach(function (step, i) {
      var rect = step.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var dist = Math.abs(center - middle);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setStep(best);
  }

  /* ---------- FAQ: uma resposta aberta por vez ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".lp-faq__item"));
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- scroll (um listener, um rAF) ---------- */
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      syncNavTheme();
      syncStep();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  syncNavTheme();
  syncStep();

  /* ano no rodapé, se existir */
  var year = document.getElementById("ano");
  if (year) year.textContent = new Date().getFullYear();
})();
