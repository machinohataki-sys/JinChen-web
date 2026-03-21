/**
 * Jinchen Crystal — GSAP Scroll Animations
 * Uses GSAP 3.12 + ScrollTrigger for all scroll-linked effects
 */

(function () {
  'use strict';

  function initGSAPAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    // Lenis integration — use Lenis-driven scroll position for ScrollTrigger
    if (window.__lenis) {
      ScrollTrigger.defaults({
        scroller: window
      });
    }

    // Global defaults — force GPU compositing on all GSAP animations
    gsap.defaults({
      force3d: true
    });

    /* ----------------------------------------
     * Section Reveal — fade up
     * All .reveal elements animate in when scrolled into view.
     * immediateRender:false prevents the "flash then disappear" bug.
     * -------------------------------------- */
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.from(el, {
        y: 30,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ----------------------------------------
     * Hero content stagger entrance (plays on load, no scroll trigger)
     * -------------------------------------- */
    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.from(heroContent.children, {
        y: 25,
        autoAlpha: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.3
      });
    }

    /* ----------------------------------------
     * Value Strip
     * -------------------------------------- */
    var valueStrip = document.querySelector('.value-strip');
    if (valueStrip) {
      gsap.from('.value-item', {
        y: 15,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: valueStrip,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    }

    /* ----------------------------------------
     * Product Cards — stagger entrance
     * -------------------------------------- */
    var productCards = gsap.utils.toArray('.product-grid .flip-card, .product-teaser .grid > *');
    if (productCards.length) {
      gsap.set(productCards, { autoAlpha: 0, y: 40 });

      ScrollTrigger.batch(productCards, {
        start: 'top 92%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.06,
            ease: 'power3.out',
            overwrite: true
          });
        }
      });
    }

    /* ----------------------------------------
     * Craftsmanship — split layout entrance
     * -------------------------------------- */
    document.querySelectorAll('.craftsmanship-grid').forEach(function (craftSection) {
      var craftText = craftSection.querySelector('.craftsmanship-text');
      var craftVisual = craftSection.querySelector('.craftsmanship-visual');

      if (craftText) {
        gsap.from(craftText, {
          x: -30,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: craftSection,
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        });
      }

      if (craftVisual) {
        gsap.from(craftVisual, {
          x: 30,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: craftSection,
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        });
      }
    });

    /* ----------------------------------------
     * Text Reveal — line by line fade up
     * -------------------------------------- */
    document.querySelectorAll('.text-reveal').forEach(function (block) {
      var lines = block.querySelectorAll('.line');
      if (!lines.length) return;

      gsap.from(lines, {
        y: 20,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: block,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ----------------------------------------
     * CTA Card — scale up entrance
     * -------------------------------------- */
    document.querySelectorAll('.cta-card').forEach(function (ctaCard) {
      gsap.from(ctaCard, {
        scale: 0.96,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: ctaCard,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ----------------------------------------
     * Timeline Items — stagger from left
     * -------------------------------------- */
    var timeline = document.querySelector('.timeline');
    if (timeline) {
      gsap.from('.timeline-item', {
        x: -20,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: timeline,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    }

    /* ----------------------------------------
     * Why Cards — stagger entrance
     * -------------------------------------- */
    document.querySelectorAll('.why-grid').forEach(function (grid) {
      gsap.from(grid.querySelectorAll('.why-card'), {
        y: 25,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ----------------------------------------
     * Factory Photos — stagger with scale
     * -------------------------------------- */
    var factoryGrid = document.querySelector('.factory-grid');
    if (factoryGrid) {
      gsap.from('.factory-photo', {
        scale: 0.95,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: factoryGrid,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    }

    /* ----------------------------------------
     * Cert badges
     * -------------------------------------- */
    document.querySelectorAll('.cert-grid').forEach(function (grid) {
      gsap.from(grid.querySelectorAll('.cert-badge'), {
        y: 15,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ----------------------------------------
     * Contact Grid — slide in from sides
     * -------------------------------------- */
    var contactGrid = document.querySelector('.contact-grid');
    if (contactGrid) {
      var contactInfo = contactGrid.children[0];
      var contactForm = contactGrid.children[1];

      if (contactInfo) {
        gsap.from(contactInfo, {
          x: -30,
          autoAlpha: 0,
          duration: 1,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: contactGrid,
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        });
      }

      if (contactForm) {
        gsap.from(contactForm, {
          x: 30,
          autoAlpha: 0,
          duration: 1,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: contactGrid,
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        });
      }
    }

    /* ----------------------------------------
     * Scroll Indicator — fade out on scroll
     * -------------------------------------- */
    var scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
      gsap.to(scrollIndicator, {
        opacity: 0,
        y: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: '30% top',
          scrub: true
        }
      });
    }

    /* ----------------------------------------
     * Cleanup on page unload
     * -------------------------------------- */
    window.addEventListener('beforeunload', function () {
      ScrollTrigger.getAll().forEach(function (trigger) {
        trigger.kill();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGSAPAnimations);
  } else {
    initGSAPAnimations();
  }
})();
