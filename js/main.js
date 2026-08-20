/* ==========================================================================
   AMEEN.DEV — Main JavaScript
   Vanilla JS · no dependencies · progressive enhancement
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initHeaderScroll();
    initThemeToggle();
    initMobileMenu();
    initTyping();
    initScrollSpy();
    initReveal();
    initCounters();
    initContactForm();
    initBackToTop();
    initFooterYear();
  });

  /* ------------------------------------------------------------------------
     PRELOADER — show briefly on first load, then fade out
     ------------------------------------------------------------------------ */
  function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    const hide = () => preloader.classList.add("done");
    // Ensure it is visible for at least ~500ms for a smooth entrance
    const minDelay = window.setTimeout(hide, 550);
    window.addEventListener("load", () => {
      window.clearTimeout(minDelay);
      hide();
    });
    // Safety: never leave the loader stuck
    window.setTimeout(hide, 3000);
  }

  /* ------------------------------------------------------------------------
     HEADER — glass blur once scrolled past the top
     ------------------------------------------------------------------------ */
  function initHeaderScroll() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------------
     THEME TOGGLE — dark default, light option, persisted to localStorage
     ------------------------------------------------------------------------ */
  function initThemeToggle() {
    const toggle = document.getElementById("theme-toggle");
    const root = document.documentElement;
    if (!toggle || !root) return;

    const getPreferred = () =>
      window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

    const apply = (theme) => {
      root.setAttribute("data-theme", theme);
      toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0e0b" : "#F5F7F3");
    };

    // Persisted choice > saved, else system preference (dark by default)
    const saved = localStorage.getItem("theme");
    apply(saved || getPreferred());

    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem("theme", next);
    });
  }

  /* ------------------------------------------------------------------------
     MOBILE MENU — hamburger toggle with close on link / Esc / resize
     ------------------------------------------------------------------------ */
  function initMobileMenu() {
    const burger = document.getElementById("hamburger");
    const menu = document.getElementById("nav-links");
    if (!burger || !menu) return;

    const setOpen = (open) => {
      burger.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    burger.addEventListener("click", () => setOpen(!menu.classList.contains("open")));

    menu.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => setOpen(false))
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     TYPING EFFECTS — hero role + terminal tech stack
     ------------------------------------------------------------------------ */
  function initTyping() {
    const roleEl = document.getElementById("typed-role");
    const techEl = document.getElementById("typed-tech");
    if (roleEl) {
      typewriter(roleEl, [
        "Full Stack Developer",
        "Python Developer",
        "Frontend Engineer",
        "UI / UX Craftsman",
        "Problem Solver",
      ]);
    }
    if (techEl) {
      techEl.classList.add("typed-tech");
      typewriter(techEl, [
        "HTML5 + CSS3 + JavaScript",
        "Python + Flask + Django",
        "REST APIs + Git",
        "Responsive Design",
        "Deploy + Maintain",
      ], { deleteSpeed: 34 });
    }
  }

  /**
   * Cycles through `words` with type / pause / delete behaviour.
   * @param {HTMLElement} el   Target element
   * @param {string[]}   words List of strings to type
   * @param {object}     opts  { typeSpeed, deleteSpeed, pause }
   */
  function typewriter(el, words, opts = {}) {
    const { typeSpeed = 72, deleteSpeed = 42, pause = 1700 } = opts;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    (function tick() {
      const word = words[wordIndex];
      charIndex = deleting ? charIndex - 1 : charIndex + 1;
      el.textContent = word.slice(0, charIndex);

      let delay = deleting ? deleteSpeed : typeSpeed;
      if (!deleting && charIndex === word.length) {
        delay = pause;      // hold full word
        deleting = true;
      } else if (deleting && charIndex === 0) {
        deleting = false;   // move to next word
        wordIndex = (wordIndex + 1) % words.length;
        delay = 320;
      }
      window.setTimeout(tick, delay);
    })();
  }

  /* ------------------------------------------------------------------------
     SCROLLSPY — highlight the nav link of the section in view
     ------------------------------------------------------------------------ */
  function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const links = Array.from(document.querySelectorAll(".nav-link"));
    if (!sections.length) return;

    const setActive = (id) => {
      links.forEach((link) =>
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`)
      );
    };

    const onScroll = () => {
      // If near the bottom, force the last section
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 60;
      if (nearBottom) {
        setActive(sections[sections.length - 1].id);
        return;
      }

      const offset = 120;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.offsetTop - offset <= window.scrollY) {
          current = section.id;
        } else {
          break;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL — fade / slide elements into view once
     ------------------------------------------------------------------------ */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     ANIMATED COUNTERS — hero stats count up when visible
     ------------------------------------------------------------------------ */
  function initCounters() {
    const counters = document.querySelectorAll(".count");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 1400;
      const start = performance.now();

      const frame = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     CONTACT FORM — client-side validation + AJAX to Flask /api/contact
     ------------------------------------------------------------------------ */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const status = document.getElementById("form-status");
    const submitBtn = document.getElementById("form-submit");

    const fields = {
      name: form.querySelector("#name"),
      email: form.querySelector("#email"),
      subject: form.querySelector("#subject"),
      message: form.querySelector("#message"),
    };

    const setStatus = (text, type) => {
      status.textContent = text;
      status.className = `form-status ${type || ""}`;
    };

    const setLoading = (loading) => {
      submitBtn.classList.toggle("is-loading", loading);
      submitBtn.disabled = loading;
    };

    // Live re-validation on input (clears the error once fixed)
    Object.values(fields).forEach((field) => {
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true" && field.checkValidity()) {
          field.setAttribute("aria-invalid", "false");
        }
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Honeypot: bots fill a hidden field — silently drop them
      const honeypot = form.querySelector("#website");
      if (honeypot && honeypot.value.trim() !== "") return;

      // Validate
      let firstInvalid = null;
      for (const field of Object.values(fields)) {
        const valid = field.checkValidity();
        field.setAttribute("aria-invalid", String(!valid));
        if (!valid && !firstInvalid) firstInvalid = field;
      }
      if (firstInvalid) {
        setStatus("Please fill in all required fields correctly.", "is-error");
        firstInvalid.focus();
        return;
      }

      setLoading(true);
      setStatus("");

      const payload = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        subject: fields.subject.value.trim(),
        message: fields.message.value.trim(),
      };

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (response.ok && data.ok) {
          setStatus("Thanks! Your message has been sent — I'll get back to you within 24 hours.", "is-success");
          form.reset();
        } else {
          setStatus(data.message || "Something went wrong. Please try again or email me directly.", "is-error");
        }
      } catch (err) {
        setStatus("Network error. Please try again or email me directly at hello@ameen.dev.", "is-error");
      } finally {
        setLoading(false);
      }
    });
  }

  /* ------------------------------------------------------------------------
     BACK TO TOP
     ------------------------------------------------------------------------ */
  function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;

    const onScroll = () => btn.classList.toggle("visible", window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ------------------------------------------------------------------------
     FOOTER YEAR
     ------------------------------------------------------------------------ */
  function initFooterYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();
