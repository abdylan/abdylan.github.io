/* Fixed-header navigation and deterministic scroll spy. No network or storage. */
(function (global) {
  "use strict";

  function chooseActive(sections, y, atBottom) {
    if (!sections.length) return null;
    if (atBottom) return sections[sections.length - 1];
    var active = sections[0];
    for (var index = 0; index < sections.length; index += 1) {
      if (sections[index].top <= y + 16) active = sections[index];
      else break;
    }
    return active;
  }

  function initNavigation(doc, win) {
    if (!doc || !win || !doc.querySelector || !doc.querySelectorAll) return null;
    var header = doc.querySelector(".site-header");
    var links = Array.prototype.slice.call(doc.querySelectorAll("nav a[href^='#']"));
    var sections = [];
    var seen = {};
    links.forEach(function (link) {
      var id = (link.hash || "").slice(1);
      if (!id || seen[id]) return;
      var element = doc.getElementById(id);
      if (!element) return;
      seen[id] = true;
      sections.push({ id: id, el: element });
    });

    var frame = 0;
    var observer = null;
    var previousActive = null;

    function headerHeight() {
      return header && header.getBoundingClientRect ? Math.max(0, header.getBoundingClientRect().height) : 0;
    }

    function setHeaderVar() {
      if (doc.documentElement && doc.documentElement.style && doc.documentElement.style.setProperty) {
        doc.documentElement.style.setProperty("--header-height", Math.round(headerHeight()) + "px");
      }
    }

    function update() {
      frame = 0;
      var scrollY = Number(win.scrollY || win.pageYOffset || 0);
      var viewport = Number(win.innerHeight || 0);
      var height = Number((doc.documentElement && doc.documentElement.scrollHeight) || 0);
      var atBottom = height > 0 && scrollY + viewport >= height - 2;
      var measured = sections.map(function (section) {
        return { id: section.id, top: section.el.getBoundingClientRect().top + scrollY };
      });
      var current = chooseActive(measured, scrollY + headerHeight(), atBottom);
      links.forEach(function (link) {
        var active = current && link.hash === "#" + current.id;
        if (active) {
          if (link.classList) link.classList.add("is-active");
          link.setAttribute("aria-current", "location");
          if (previousActive !== current.id && typeof link.scrollIntoView === "function") {
            link.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
          }
        } else {
          if (link.classList) link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        }
      });
      previousActive = current && current.id;
    }

    function schedule() {
      if (frame) return;
      frame = 1;
      if (typeof win.requestAnimationFrame === "function") win.requestAnimationFrame(update);
      else update();
    }

    function onResize() {
      setHeaderVar();
      schedule();
    }

    setHeaderVar();
    update();
    win.addEventListener("scroll", schedule, { passive: true });
    win.addEventListener("resize", onResize);
    win.addEventListener("hashchange", schedule);
    win.addEventListener("load", update);
    if (header && typeof win.ResizeObserver === "function") {
      observer = new win.ResizeObserver(onResize);
      observer.observe(header);
    }

    return {
      update: update,
      destroy: function () {
        win.removeEventListener("scroll", schedule);
        win.removeEventListener("resize", onResize);
        win.removeEventListener("hashchange", schedule);
        win.removeEventListener("load", update);
        if (observer) observer.disconnect();
      }
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { chooseActive: chooseActive, initNavigation: initNavigation };
  }
  if (global && global.document) initNavigation(global.document, global);
}(typeof window !== "undefined" ? window : undefined));
