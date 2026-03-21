/**
 * Jinchen Crystal — Main JavaScript
 * Navigation, preloader, scroll effects, shared utilities
 */

(function () {
  'use strict';

  /* ----------------------------------------
   * Preloader
   * -------------------------------------- */
  function initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;

    const maxWait = setTimeout(() => dismissPreloader(preloader), 3000);

    window.addEventListener('load', () => {
      clearTimeout(maxWait);
      dismissPreloader(preloader);
    });
  }

  function dismissPreloader(el) {
    if (el.classList.contains('fade-out')) return;
    el.classList.add('fade-out');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }

  /* ----------------------------------------
   * Navigation
   * -------------------------------------- */
  function initNavigation() {
    const nav = document.querySelector('.site-nav');
    const hamburger = document.querySelector('.nav-hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu .nav-link, .mobile-menu .nav-cta');

    if (!nav) return;

    // Scroll behavior — solid bg after hero
    const scrollThreshold = 80;

    function handleNavScroll() {
      if (window.scrollY > scrollThreshold) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // Hamburger toggle
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
        hamburger.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));

        // Pause/resume Lenis smooth scroll
        if (window.__lenis) {
          isOpen ? window.__lenis.stop() : window.__lenis.start();
        }
      });

      // Close on link click
      mobileLinks.forEach((link) => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('open');
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
          hamburger.classList.remove('open');
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
          hamburger.setAttribute('aria-expanded', 'false');
          mobileMenu.setAttribute('aria-hidden', 'true');
          hamburger.focus();
        }
      });
    }
  }

  /* ----------------------------------------
   * Scroll to Top
   * -------------------------------------- */
  function initScrollToTop() {
    const btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    function toggleVisibility() {
      if (window.scrollY > window.innerHeight) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener('click', () => {
      if (window.__lenis) {
        window.__lenis.scrollTo(0, { duration: 1.5 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ----------------------------------------
   * Hero 3D Mouse Parallax
   * -------------------------------------- */
  function initHeroParallax() {
    const heroLayers = document.querySelector('.hero-layers');
    if (!heroLayers) return;

    // Skip on mobile or reduced motion
    if (window.innerWidth < 768) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const heroTitle = document.getElementById('hero-title');

    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let targetGradPos = 50;
    let currentGradPos = 50;
    let targetBrightness = 1.1;
    let currentBrightness = 1.1;
    const lerp = 0.04;
    const maxAngle = 6;

    document.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const ratioX = (e.clientX - centerX) / centerX;
      const ratioY = (e.clientY - centerY) / centerY;

      targetRotateY = ratioX * maxAngle;
      targetRotateX = -ratioY * maxAngle;

      // Gradient position: map mouse X to 0-100%
      targetGradPos = (e.clientX / window.innerWidth) * 100;

      // Brightness: slightly brighter near center
      const distFromCenter = Math.sqrt(ratioX * ratioX + ratioY * ratioY);
      targetBrightness = 1.05 + (1 - Math.min(distFromCenter, 1)) * 0.25;
    });

    function updateParallax() {
      // Only compute when hero is visible
      const rect = heroLayers.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        currentRotateX += (targetRotateX - currentRotateX) * lerp;
        currentRotateY += (targetRotateY - currentRotateY) * lerp;

        heroLayers.style.transform =
          'rotateX(' + currentRotateX.toFixed(3) + 'deg) rotateY(' + currentRotateY.toFixed(3) + 'deg)';

        // Title color shift
        if (heroTitle) {
          currentGradPos += (targetGradPos - currentGradPos) * 0.03;
          currentBrightness += (targetBrightness - currentBrightness) * 0.05;
          heroTitle.style.backgroundPosition = currentGradPos.toFixed(1) + '% 50%';
          heroTitle.style.filter = 'brightness(' + currentBrightness.toFixed(3) + ')';
        }
      }

      requestAnimationFrame(updateParallax);
    }

    requestAnimationFrame(updateParallax);
  }

  /* ----------------------------------------
   * Section Reveal (Intersection Observer)
   * -------------------------------------- */
  /**
   * Reveal animations — only used as fallback if GSAP is not loaded.
   * When GSAP + ScrollTrigger are present, animations.js handles all .reveal elements.
   */
  function initRevealAnimations() {
    // If GSAP is handling reveals, skip this
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') return;

    // Fallback: just make everything visible immediately (no animation without GSAP)
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => {
      el.style.opacity = '1';
    });
  }

  /* ----------------------------------------
   * Text Reveal (Line by Line)
   * -------------------------------------- */
  /**
   * Text Reveal — now handled by GSAP in animations.js
   * This is a no-JS fallback only.
   */
  function initTextReveal() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') return;
    // Fallback: just show all lines immediately
    document.querySelectorAll('.text-reveal .line').forEach((line) => {
      line.style.opacity = '1';
    });
  }

  /* ----------------------------------------
   * Value Counter Animation
   * -------------------------------------- */
  function initCountUp() {
    const counters = document.querySelectorAll('[data-target]');
    if (!counters.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      counters.forEach((el) => formatCounter(el, parseFloat(el.getAttribute('data-target'))));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /**
   * Format a counter value with prefix, suffix, commas, decimals
   * @param {HTMLElement} el
   * @param {number} value
   */
  function formatCounter(el, value) {
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    const useComma = el.getAttribute('data-format') === 'comma';

    let display;
    if (decimals > 0) {
      display = value.toFixed(decimals);
    } else {
      display = Math.floor(value).toString();
    }

    if (useComma) {
      display = display.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    el.textContent = prefix + display + suffix;
  }

  /**
   * Animate a counter from 0 to data-target with prefix/suffix support
   * @param {HTMLElement} el
   */
  function animateCounter(el) {
    if (el.dataset.counting) return;
    el.dataset.counting = '1';
    const target = parseFloat(el.getAttribute('data-target'));
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      formatCounter(el, current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        formatCounter(el, target);
      }
    }

    requestAnimationFrame(update);
  }

  /* ----------------------------------------
   * Product Card Tilt (mouse tracking)
   * -------------------------------------- */
  function initCardTilt() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Disable on touch devices
    if ('ontouchstart' in window) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform =
          'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-8px)';
        card.style.transition = 'none';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  /* ----------------------------------------
   * FAQ Accordion
   * -------------------------------------- */
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all others
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('open');
            const otherQ = other.querySelector('.faq-question');
            if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('open', !isOpen);
        question.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  /* ----------------------------------------
   * Lenis Smooth Scroll — Apple-like buttery scrolling
   * Interpolates scroll position with lerp for 60fps silky movement.
   * Syncs with GSAP ScrollTrigger for animation coordination.
   * -------------------------------------- */
  function initLenisScroll() {
    if (typeof Lenis === 'undefined') {
      // Fallback: native smooth scroll for anchor links
      initNativeSmoothScroll();
      return;
    }

    // Skip on reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      initNativeSmoothScroll();
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false
    });

    // Expose globally so other scripts can access it
    window.__lenis = lenis;

    // Connect Lenis with GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback RAF loop if no GSAP
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    // Smooth scroll for anchor links via Lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, { offset: 0, duration: 1.2 });
        }
      });
    });

    // Stop Lenis during mobile menu open
    document.addEventListener('lenis:stop', function () { lenis.stop(); });
    document.addEventListener('lenis:start', function () { lenis.start(); });
  }

  function initNativeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ----------------------------------------
   * Initialize All
   * -------------------------------------- */
  /* ----------------------------------------
   * Dynamic Favicon — invert brand.png to gold on dark
   * -------------------------------------- */
  function initFavicon() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Transparent background — no box, no fill
      ctx.clearRect(0, 0, size, size);

      // Draw brand image full size
      ctx.drawImage(img, 0, 0, size, size);

      // Read all pixels, turn logo gold, remove white background
      const imageData = ctx.getImageData(0, 0, size, size);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;

        if (brightness > 160) {
          // White / light area → fully transparent
          d[i + 3] = 0;
        } else {
          // Dark area (logo body) → gold, opacity based on darkness
          const strength = 1 - brightness / 160;
          d[i] = 201;
          d[i + 1] = 169;
          d[i + 2] = 110;
          d[i + 3] = Math.round(255 * strength);
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Set as favicon
      const link = document.querySelector('link[rel="icon"][type="image/svg+xml"]')
        || document.querySelector('link[rel="icon"]');
      if (link) {
        link.type = 'image/png';
        link.href = canvas.toDataURL('image/png');
      }

      // Also set apple-touch-icon
      const apple = document.querySelector('link[rel="apple-touch-icon"]');
      if (apple) {
        apple.href = canvas.toDataURL('image/png');
      }
    };
    img.src = 'assets/images/brand.png';
  }

  initPreloader();

  document.addEventListener('DOMContentLoaded', () => {
    initFavicon();
    initNavigation();
    initScrollToTop();
    initHeroParallax();
    initRevealAnimations();
    initTextReveal();
    initCountUp();
    initCardTilt();
    initFAQ();
    initLenisScroll();
  });
})();
