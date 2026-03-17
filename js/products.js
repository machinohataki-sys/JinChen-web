/**
 * Jinchen Crystal — Products Page
 * Filter, search, product card interactions, modal
 */

(function () {
  'use strict';

  /**
   * Color Palette Picker — sort products by color proximity
   */
  function initColorPalette() {
    var palette = document.getElementById('color-palette');
    var indicator = document.getElementById('palette-indicator');
    var hint = document.querySelector('.color-palette-hint');
    var grid = document.getElementById('product-grid');
    if (!palette || !grid) return;

    var cards = Array.from(grid.querySelectorAll('.flip-card'));
    if (!cards.length) return;

    var paletteNeutral = document.getElementById('color-palette-neutral');
    var indicatorNeutral = document.getElementById('palette-indicator-neutral');

    var isDragging = false;
    var isActive = false;
    var rafId = null;
    var pendingX = null;
    var activeSource = null; // 'hue' or 'neutral'

    // HSL → approximate Lab-like values for perceptual distance
    function hslToRgb(h, s, l) {
      h /= 360; s /= 100; l /= 100;
      var r, g, b;
      if (s === 0) { r = g = b = l; } else {
        function hue2rgb(p, q, t) {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return [r * 255, g * 255, b * 255];
    }

    // Color distance in RGB (weighted for human perception)
    function colorDist(h1, s1, l1, h2, s2, l2) {
      var rgb1 = hslToRgb(h1, s1, l1);
      var rgb2 = hslToRgb(h2, s2, l2);
      var dr = rgb1[0] - rgb2[0];
      var dg = rgb1[1] - rgb2[1];
      var db = rgb1[2] - rgb2[2];
      // Weighted Euclidean (red-sensitive human vision)
      return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
    }

    // Clear all GSAP inline styles so reordered cards display correctly
    function clearGsapState(card) {
      card.style.visibility = 'visible';
      card.style.opacity = '';
      card.style.transform = 'none';
      card.style.willChange = 'auto';
      // Kill GSAP tweens on this element
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: 'all' });
        card.style.visibility = 'visible';
      }
    }

    // Sort and show/hide by color proximity
    function sortByColor(hue, paletteSat, paletteLit) {
      // Calculate distance for each card
      var cardDists = cards.map(function (card) {
        var h = parseFloat(card.dataset.hue) || 0;
        var s = parseFloat(card.dataset.sat) || 50;
        var l = parseFloat(card.dataset.lit) || 50;
        return { card: card, dist: colorDist(hue, paletteSat, paletteLit, h, s, l) };
      });

      // Sort by distance
      cardDists.sort(function (a, b) { return a.dist - b.dist; });

      // Threshold: show closest matches, hide the rest
      var bestDist = cardDists[0].dist;
      var threshold = Math.max(bestDist + 120, 180);

      // Reorder DOM and show/hide
      var frag = document.createDocumentFragment();
      cardDists.forEach(function (item) {
        var card = item.card;
        clearGsapState(card);
        // Reset transform after clearProps
        card.style.transform = '';

        if (item.dist <= threshold) {
          card.style.display = '';
          card.style.visibility = 'visible';
          var norm = (item.dist - bestDist) / Math.max(threshold - bestDist, 1);
          card.style.opacity = (1 - norm * 0.4).toFixed(2);
        } else {
          card.style.display = 'none';
        }
        frag.appendChild(card);
      });

      var emptyState = grid.querySelector('.empty-state');
      if (emptyState) frag.appendChild(emptyState);
      grid.appendChild(frag);
    }

    // Handle color palette interaction (hue)
    function handleHueInteraction(clientX) {
      var rect = palette.getBoundingClientRect();
      var x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      var ratio = x / rect.width;
      var hue = ratio * 355;
      var colorStr = 'hsl(' + hue + ', 45%, 45%)';

      // Update hue indicator, hide neutral indicator
      indicator.style.left = x + 'px';
      indicator.style.backgroundColor = colorStr;
      indicator.style.color = colorStr;
      indicator.classList.add('active');
      indicator.classList.remove('droplet');
      indicatorNeutral.classList.remove('active');

      if (hint && !hint.classList.contains('hidden')) hint.classList.add('hidden');

      isActive = true;
      activeSource = 'hue';
      sortByColor(hue, 45, 45);
    }

    // Handle neutral palette interaction (white→black)
    function handleNeutralInteraction(clientX) {
      var rect = paletteNeutral.getBoundingClientRect();
      var x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      var ratio = x / rect.width;
      var lit = 95 - ratio * 85; // 95% (white) → 10% (black)
      var colorStr = 'hsl(0, 0%, ' + lit.toFixed(0) + '%)';

      // Update neutral indicator, hide hue indicator
      indicatorNeutral.style.left = x + 'px';
      indicatorNeutral.style.backgroundColor = colorStr;
      indicatorNeutral.style.color = colorStr;
      indicatorNeutral.classList.add('active');
      indicatorNeutral.classList.remove('droplet');
      indicator.classList.remove('active');

      if (hint && !hint.classList.contains('hidden')) hint.classList.add('hidden');

      isActive = true;
      activeSource = 'neutral';
      sortByColor(0, 0, lit);
    }

    // Throttled update
    function throttledUpdate(clientX) {
      pendingX = clientX;
      if (!rafId) {
        rafId = requestAnimationFrame(function () {
          rafId = null;
          if (pendingX !== null) {
            if (activeSource === 'neutral') handleNeutralInteraction(pendingX);
            else handleHueInteraction(pendingX);
          }
        });
      }
    }

    // Create droplet elements
    var DROP_COUNT = 16;

    function createDroplets(container, type) {
      for (var d = 0; d < DROP_COUNT; d++) {
        var drop = document.createElement('div');
        drop.className = 'color-drop';
        var ratio = d / (DROP_COUNT - 1);
        // Color from the palette gradient
        if (type === 'hue') {
          var hue = ratio * 355;
          drop.style.backgroundColor = 'hsl(' + hue + ', 40%, 42%)';
        } else {
          var lit = 90 - ratio * 80;
          drop.style.backgroundColor = 'hsl(0, 0%, ' + lit + '%)';
        }
        // Random vertical offset for organic feel
        var yOff = (Math.random() - 0.5) * 6;
        drop.style.setProperty('--drop-y', yOff.toFixed(1) + 'px');
        // Staggered delay
        drop.style.transitionDelay = (d * 0.025).toFixed(3) + 's';
        container.appendChild(drop);
      }
    }

    var dropletsHue = document.getElementById('droplets-hue');
    var dropletsNeutral = document.getElementById('droplets-neutral');
    createDroplets(dropletsHue, 'hue');
    createDroplets(dropletsNeutral, 'neutral');

    // Dissolve the other palette into droplets
    function dissolveOther(source) {
      var other = (source === 'hue') ? paletteNeutral : palette;
      var otherWrap = other ? other.closest('.color-palette-wrap') : null;
      if (!other || other.classList.contains('dissolved')) return;

      other.classList.remove('reforming');
      other.classList.add('dissolved');
      if (otherWrap) {
        otherWrap.classList.remove('hide-drops');
        otherWrap.classList.add('show-drops');
      }
    }

    // Reform the other palette from droplets
    function reformOther(source) {
      var other = (source === 'hue') ? paletteNeutral : palette;
      var otherWrap = other ? other.closest('.color-palette-wrap') : null;
      if (!other || !other.classList.contains('dissolved')) return;

      // Collapse droplets first
      if (otherWrap) {
        otherWrap.classList.remove('show-drops');
        otherWrap.classList.add('hide-drops');
      }

      // After droplets collapse, show bar again
      setTimeout(function () {
        if (otherWrap) otherWrap.classList.remove('hide-drops');
        other.classList.remove('dissolved');
      }, 350);
    }

    // Helper: attach palette events to a bar element
    function attachPaletteEvents(bar, ind, handler, source) {
      bar.addEventListener('mouseenter', function () {
        if (bar.classList.contains('dissolved')) return;
        bar.classList.add('active');
        ind.classList.remove('droplet');
        dissolveOther(source);
      });

      bar.addEventListener('mouseleave', function () {
        if (isDragging) return;
        bar.classList.remove('active');
        ind.classList.add('droplet');
        ind.addEventListener('animationend', function h() {
          ind.classList.remove('active', 'droplet');
          ind.removeEventListener('animationend', h);
          // Reform the other palette after indicator disappears
          reformOther(source);
        });
      });

      bar.addEventListener('mousemove', function (e) {
        if (isDragging || bar.classList.contains('dissolved')) return;
        var rect = bar.getBoundingClientRect();
        var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        var ratio = x / rect.width;
        var colorStr;
        if (source === 'neutral') {
          var lit = 95 - ratio * 85;
          colorStr = 'hsl(0, 0%, ' + lit.toFixed(0) + '%)';
        } else {
          var hue = ratio * 355;
          colorStr = 'hsl(' + hue + ', 45%, 45%)';
        }
        ind.style.left = x + 'px';
        ind.style.backgroundColor = colorStr;
        ind.style.color = colorStr;
        if (!ind.classList.contains('active')) ind.classList.add('active');
      });

      bar.addEventListener('mousedown', function (e) {
        if (bar.classList.contains('dissolved')) return;
        e.preventDefault();
        isDragging = true;
        activeSource = source;
        ind.classList.add('dragging');
        bar.classList.add('active');
        dissolveOther(source);
        handler(e.clientX);
      });

      bar.addEventListener('touchstart', function (e) {
        if (bar.classList.contains('dissolved')) return;
        isDragging = true;
        activeSource = source;
        dissolveOther(source);
        handler(e.touches[0].clientX);
      }, { passive: true });

      bar.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        e.preventDefault();
        throttledUpdate(e.touches[0].clientX);
      }, { passive: false });

      bar.addEventListener('touchend', function () { isDragging = false; });
    }

    attachPaletteEvents(palette, indicator, handleHueInteraction, 'hue');
    attachPaletteEvents(paletteNeutral, indicatorNeutral, handleNeutralInteraction, 'neutral');

    // Global mouse move/up for drag
    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      throttledUpdate(e.clientX);
    });

    document.addEventListener('mouseup', function () {
      if (isDragging) {
        var src = activeSource;
        isDragging = false;
        indicator.classList.remove('dragging');
        indicatorNeutral.classList.remove('dragging');
        palette.classList.remove('active');
        if (paletteNeutral) paletteNeutral.classList.remove('active');
      }
    });

    // Double-click to reset
    // Double-click either palette to reset
    function resetPalette() {
      isActive = false;
      activeSource = null;
      indicator.classList.remove('active');
      indicatorNeutral.classList.remove('active');
      palette.classList.remove('dissolved');
      paletteNeutral.classList.remove('dissolved');
      document.querySelectorAll('.color-palette-wrap').forEach(function (w) {
        w.classList.remove('show-drops', 'hide-drops');
      });
      if (hint) hint.classList.remove('hidden');

      cards.forEach(function (card) {
        card.style.opacity = '';
        card.style.transform = '';
        card.style.display = '';
        card.style.visibility = 'visible';
        grid.appendChild(card);
      });
      var emptyState = grid.querySelector('.empty-state');
      if (emptyState) grid.appendChild(emptyState);
    }

    palette.addEventListener('dblclick', resetPalette);
    if (paletteNeutral) paletteNeutral.addEventListener('dblclick', resetPalette);
  }

  /**
   * Initialize product detail modal
   */
  function initModal() {
    var modal = document.querySelector('.modal-overlay');
    var modalClose = document.querySelector('.modal-close');
    var modalContent = document.querySelector('.modal-content');

    if (!modal) return;

    var modalTitle = modal.querySelector('#modal-product-name');
    var modalSizes = modal.querySelector('#modal-sizes');
    var modalApps = modal.querySelector('#modal-applications');
    var modalFamily = modal.querySelector('#modal-color-family');
    var modalImage = modal.querySelector('#modal-image');
    var modalCTA = modal.querySelector('#modal-cta');

    // Open modal on card back CTA click or via detail button
    document.querySelectorAll('.flip-card').forEach(function (card) {
      var detailBtn = card.querySelector('.flip-card-back .btn-primary');
      if (!detailBtn) return;

      // Prevent the link from navigating; open modal instead
      detailBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var backPanel = card.querySelector('.flip-card-back');
        var frontImage = card.querySelector('.product-card-image');
        var name = card.querySelector('.flip-card-front .product-card-title');
        name = name ? name.textContent : 'Crystal';

        var sizes = backPanel ? (backPanel.querySelectorAll('p')[3] || {}).textContent : 'SS6–SS40';
        var apps = backPanel ? (backPanel.querySelectorAll('p')[5] || {}).textContent : 'Fashion, Accessories, Bridal';
        var family = backPanel ? (backPanel.querySelectorAll('p')[1] || {}).textContent : 'Classic';
        var color = frontImage ? frontImage.getAttribute('data-color') : '#333';

        if (modalTitle) modalTitle.textContent = name;
        if (modalSizes) modalSizes.textContent = sizes;
        if (modalApps) modalApps.textContent = apps;
        if (modalFamily) modalFamily.textContent = family;
        if (modalImage) modalImage.style.backgroundColor = color;
        if (modalCTA) modalCTA.textContent = 'Request Quote for ' + name;

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Focus trap
        if (modalClose) modalClose.focus();
      });
    });

    // Close modal
    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // Click outside to close
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // Escape to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  /**
   * Initialize flip card tilt effect on non-touch devices
   */
  function initFlipCards() {
    if ('ontouchstart' in window) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var cards = document.querySelectorAll('.flip-card');
    cards.forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Flip card to see details');

      // Click/touch to toggle flip
      card.addEventListener('click', function (e) {
        // Don't flip if clicking a link/button inside
        if (e.target.closest('a, button')) return;
        card.classList.toggle('flipped');
      });

      // Keyboard support
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.classList.toggle('flipped');
        }
      });
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initColorPalette();
      initModal();
      initFlipCards();
    });
  } else {
    initColorPalette();
    initModal();
    initFlipCards();
  }
})();
