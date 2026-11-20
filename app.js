(function () {
  "use strict";

  var head = document.getElementById("head");
  var lastY = -1;

  function onScroll() {
    var y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    head.classList.toggle("is-stuck", y > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var year = document.getElementById("ano");
  if (year) year.textContent = new Date().getFullYear();

  var items = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.slice.call(el.parentElement.querySelectorAll(".reveal"));
      var index = siblings.indexOf(el);
      el.style.transitionDelay = Math.min(index, 3) * 70 + "ms";
      el.classList.add("is-in");
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  items.forEach(function (el) { io.observe(el); });

  /* leve paralaxe no halo do topo — desligado em telas pequenas */
  var spec = document.querySelector(".spec");
  if (spec && window.matchMedia("(pointer: fine)").matches) {
    var raf = null;
    document.addEventListener("mousemove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var x = (e.clientX / window.innerWidth - 0.5) * 2;
        var y = (e.clientY / window.innerHeight - 0.5) * 2;
        spec.style.transform = "translate(" + (x * 4).toFixed(2) + "px," + (y * 4).toFixed(2) + "px)";
      });
    }, { passive: true });
  }
})();
