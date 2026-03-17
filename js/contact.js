/**
 * Jinchen Crystal — Contact Page
 * Form validation and submission handling
 */

(function () {
  'use strict';

  function initContactForm() {
    var form = document.getElementById('inquiry-form');
    if (!form) return;

    var submitBtn = form.querySelector('.btn-submit');
    var successMessage = document.querySelector('.form-success');
    var formWrapper = form.closest('.contact-form-card') || form;

    // Validation rules
    var rules = {
      'company': {
        required: true,
        message: 'Please enter your company name'
      },
      'contact-name': {
        required: true,
        message: 'Please enter your name'
      },
      'email': {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      }
    };

    /**
     * Validate a single field
     * @param {HTMLElement} field
     * @returns {boolean}
     */
    function validateField(field) {
      var name = field.getAttribute('name');
      var rule = rules[name];
      if (!rule) return true;

      var value = field.value.trim();
      var group = field.closest('.form-group');
      var errorEl = group ? group.querySelector('.form-error') : null;
      var isValid = true;

      if (rule.required && !value) {
        isValid = false;
      } else if (rule.pattern && value && !rule.pattern.test(value)) {
        isValid = false;
      }

      if (group) {
        group.classList.toggle('has-error', !isValid);
      }

      if (!isValid) {
        field.classList.add('error');
        field.classList.remove('success');
        if (errorEl) {
          errorEl.textContent = rule.message;
          errorEl.setAttribute('role', 'alert');
        }
      } else if (value) {
        field.classList.remove('error');
        field.classList.add('success');
        if (group) group.classList.remove('has-error');
      } else {
        field.classList.remove('error');
        field.classList.remove('success');
        if (group) group.classList.remove('has-error');
      }

      return isValid;
    }

    /**
     * Validate entire form
     * @returns {boolean}
     */
    function validateForm() {
      var fields = form.querySelectorAll('.form-input[name]');
      var allValid = true;

      fields.forEach(function (field) {
        if (!validateField(field)) {
          allValid = false;
        }
      });

      return allValid;
    }

    // Real-time validation on blur
    form.querySelectorAll('.form-input').forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });

      // Clear error on input
      field.addEventListener('input', function () {
        var group = field.closest('.form-group');
        if (group && group.classList.contains('has-error')) {
          validateField(field);
        }
      });
    });

    // Form submission
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) {
        // Focus first error field
        var firstError = form.querySelector('.form-input.error');
        if (firstError) firstError.focus();
        return;
      }

      // Disable submit
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending your inquiry...';
      }

      // Submit to Formspree
      var formData = new FormData(form);

      fetch('https://formspree.io/f/xvzwwenl', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            // Show success
            form.style.display = 'none';
            if (successMessage) {
              successMessage.classList.add('visible');
            }

            // Reset form for potential re-use
            form.reset();
            form.querySelectorAll('.form-input').forEach(function (field) {
              field.classList.remove('error', 'success');
            });
            form.querySelectorAll('.form-group').forEach(function (group) {
              group.classList.remove('has-error');
            });
          } else {
            throw new Error('Form submission failed');
          }
        })
        .catch(function () {
          alert('Submission failed. Please email us directly at machinohataki@gmail.com');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Inquiry';
          }
        });
    });
  }

  function initFormTilt() {
    var card = document.querySelector('.contact-form-card');
    if (!card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    var maxAngle = 6;
    var currentX = 0, currentY = 0, targetX = 0, targetY = 0;
    var raf = null;

    card.style.transformStyle = 'preserve-3d';
    card.style.transition = 'none';

    function lerp(a, b, t) { return a + (b - a) * t; }

    function update() {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);

      if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
        card.style.transform =
          'perspective(800px) rotateY(' + currentX.toFixed(2) + 'deg) rotateX(' + currentY.toFixed(2) + 'deg)';
        raf = requestAnimationFrame(update);
      } else {
        card.style.transform =
          'perspective(800px) rotateY(' + targetX.toFixed(2) + 'deg) rotateX(' + targetY.toFixed(2) + 'deg)';
        raf = null;
      }
    }

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      targetX = x * maxAngle * 2;
      targetY = -y * maxAngle * 2;

      if (!raf) raf = requestAnimationFrame(update);
    });

    card.addEventListener('mouseleave', function () {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(update);
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initContactForm(); initFormTilt(); });
  } else {
    initContactForm();
    initFormTilt();
  }
})();
