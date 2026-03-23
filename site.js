/**
 * Britten Woodworking — site.js
 * Mobile nav · Dropdown touch · Scroll reveals · Form handler
 */

(function () {
  'use strict';

  /* =========================================================
     UTILITIES
  ========================================================= */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* =========================================================
     1. MOBILE NAV OVERLAY
     ─────────────────────────────────────────────────────────
     Burger button toggles a full-screen overlay.
     Work dropdown expands inline with an accordion.
     Trap focus while open. ESC closes.
  ========================================================= */

  function initMobileNav() {
    var burger   = $('.site-nav__burger');
    var navLinks = $('.site-nav__links');
    var overlay  = null;
    var firstFocusable = null;
    var lastFocusable = null;

    if (!burger || !navLinks) return;

    // Build the overlay element
    overlay = document.createElement('div');
    overlay.id = 'mobile-menu';
    overlay.className = 'mobile-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Navigation menu');

    // Clone the nav links into the overlay
    var clonedNav = navLinks.cloneNode(true);
    clonedNav.classList.add('mobile-nav__list');
    overlay.appendChild(clonedNav);

    // Add close button inside overlay
    var closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-overlay__close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML = '&times;';
    overlay.insertBefore(closeBtn, overlay.firstChild);

    // Append to body
    document.body.appendChild(overlay);

    // Wire up Work dropdown accordion inside overlay
    var dropdownTrigger = overlay.querySelector('.site-nav__dropdown-trigger');
    var dropdownPanel   = overlay.querySelector('.site-nav__dropdown');

    if (dropdownTrigger && dropdownPanel) {
      dropdownPanel.style.display = 'none';
      dropdownTrigger.setAttribute('aria-expanded', 'false');

      dropdownTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = dropdownPanel.style.display !== 'none';
        dropdownPanel.style.display = isOpen ? 'none' : 'block';
        dropdownTrigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      });
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      if (!overlay.classList.contains('is-open')) return;
      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }

    // Open
    function openNav() {
      var focusable = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', overlay);
      firstFocusable = focusable[0] || null;
      lastFocusable = focusable[focusable.length - 1] || null;
      overlay.addEventListener('keydown', trapFocus);
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      burger.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      // Shift burger lines to X
      var lines = $$('.site-nav__burger-top, .site-nav__burger-bottom', burger);
      if (lines[0]) lines[0].style.transform = 'translateY(6px) rotate(45deg)';
      if (lines[1]) lines[1].style.transform = 'translateY(-6px) rotate(-45deg)';
      // Focus first link
      setTimeout(function () {
        var firstLink = firstFocusable || overlay.querySelector('a, button');
        if (firstLink) firstLink.focus();
      }, 50);
    }

    // Close
    function closeNav() {
      overlay.removeEventListener('keydown', trapFocus);
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      burger.classList.remove('is-active');
      document.body.style.overflow = '';
      var lines = $$('.site-nav__burger-top, .site-nav__burger-bottom', burger);
      if (lines[0]) lines[0].style.transform = '';
      if (lines[1]) lines[1].style.transform = '';
      firstFocusable = null;
      lastFocusable = null;
      burger.focus();
    }

    burger.addEventListener('click', function () {
      overlay.classList.contains('is-open') ? closeNav() : openNav();
    });

    closeBtn.addEventListener('click', closeNav);

    // ESC to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeNav();
    });

    // Tap outside content to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeNav();
    });

    // Close when a nav link is clicked
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  /* =========================================================
     2. DESKTOP DROPDOWN — keyboard + aria-expanded
     ─────────────────────────────────────────────────────────
     Supplements the CSS :hover with keyboard support.
     Tab away or ESC closes the panel.
  ========================================================= */

  function initDesktopDropdown() {
    var items = $$('.site-nav__item--has-dropdown');

    items.forEach(function (item) {
      var trigger = item.querySelector('.site-nav__dropdown-trigger');
      var panel   = item.querySelector('.site-nav__dropdown');
      if (!trigger || !panel) return;

      function open() {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.display = 'block';
      }
      function close() {
        trigger.setAttribute('aria-expanded', 'false');
        panel.style.display = '';
      }

      // Mouse — CSS handles it, but keep aria in sync
      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', close);

      // Keyboard — Enter/Space on trigger
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var isOpen = trigger.getAttribute('aria-expanded') === 'true';
          isOpen ? close() : open();
        }
        if (e.key === 'Escape') close();
      });

      // Close when focus leaves the item entirely
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });
    });
  }

  /* =========================================================
     3. SCROLL REVEALS
     ─────────────────────────────────────────────────────────
     Elements with data-reveal fade+slide in when they enter
     the viewport. Uses IntersectionObserver — no scroll jank.
     Falls back gracefully if IO not supported.
  ========================================================= */

  function initScrollReveals() {
    if (!window.IntersectionObserver) return;

    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    targets.forEach(function (el) {
      el.classList.add('will-reveal');
      observer.observe(el);
    });
  }

  /* =========================================================
     4. CONTACT FORM HANDLER
     ─────────────────────────────────────────────────────────
     Works with Netlify Forms out of the box.
     Adds client-side validation + success/error feedback.
     No external dependencies.
  ========================================================= */

  function initForms() {
    /* Netlify Forms — native HTML POST.
       Only ensures hidden form-name input exists. No JS interception. */
    $$('.contact-form').forEach(function (form) {
      if (!form.querySelector('input[name="form-name"]')) {
        var hidden = document.createElement('input');
        hidden.type  = 'hidden';
        hidden.name  = 'form-name';
        hidden.value = form.getAttribute('name') || 'contact';
        form.insertBefore(hidden, form.firstChild);
      }
    });
  }

  /* =========================================================
     5. SMOOTH ANCHOR SCROLL
     ─────────────────────────────────────────────────────────
     Accounts for sticky nav height when jumping to #anchors.
  ========================================================= */

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        var navHeight = ($('.site-nav') || {}).offsetHeight || 72;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* =========================================================
     6. PROJECT GALLERY LIGHTBOX
     ─────────────────────────────────────────────────────────
     Binds every .gallery-img on project pages to a shared
     lightbox with caption, counter, arrows, and keyboard nav.
  ========================================================= */

  function initProjectLightbox() {
    var galleryImages = $$('.gallery-img');
    if (!galleryImages.length) return;

    var images = galleryImages.filter(function (img) {
      return !!img.getAttribute('src');
    });
    if (!images.length) return;

    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image lightbox');

    lightbox.innerHTML = [
      '<button class="lightbox__close" type="button" aria-label="Close image">&times;</button>',
      '<button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous image">&#10094;</button>',
      '<div class="lightbox__inner">',
      '  <img class="lightbox__img" alt="" />',
      '  <p class="lightbox__caption"></p>',
      '</div>',
      '<button class="lightbox__nav lightbox__next" type="button" aria-label="Next image">&#10095;</button>',
      '<div class="lightbox__counter" aria-live="polite"></div>'
    ].join('');

    document.body.appendChild(lightbox);

    var lightboxImage = $('.lightbox__img', lightbox);
    var lightboxCaption = $('.lightbox__caption', lightbox);
    var lightboxCounter = $('.lightbox__counter', lightbox);
    var closeButton = $('.lightbox__close', lightbox);
    var previousButton = $('.lightbox__prev', lightbox);
    var nextButton = $('.lightbox__next', lightbox);

    var currentIndex = -1;
    var previousBodyOverflow = '';

    function setImage(index) {
      var activeImage = images[index];
      var source = activeImage.currentSrc || activeImage.getAttribute('src') || '';
      var caption = activeImage.getAttribute('data-caption') || activeImage.getAttribute('alt') || '';

      lightboxImage.src = source;
      lightboxImage.alt = activeImage.getAttribute('alt') || '';
      lightboxCaption.textContent = caption;
      lightboxCounter.textContent = (index + 1) + ' / ' + images.length;
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = previousBodyOverflow;
      currentIndex = -1;
    }

    function openLightbox(index) {
      currentIndex = index;
      setImage(currentIndex);
      previousBodyOverflow = document.body.style.overflow;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }

    function moveBy(step) {
      if (currentIndex < 0) return;
      currentIndex = (currentIndex + step + images.length) % images.length;
      setImage(currentIndex);
    }

    images.forEach(function (image, index) {
      image.setAttribute('tabindex', '0');
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', 'Open image ' + (index + 1) + ' of ' + images.length);

      image.addEventListener('click', function () {
        openLightbox(index);
      });

      image.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(index);
        }
      });
    });

    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', function (event) {
      event.stopPropagation();
      moveBy(-1);
    });
    nextButton.addEventListener('click', function (event) {
      event.stopPropagation();
      moveBy(1);
    });

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') moveBy(-1);
      if (event.key === 'ArrowRight') moveBy(1);
    });
  }

  /* =========================================================
     INIT
  ========================================================= */

  onReady(function () {
    initMobileNav();
    initDesktopDropdown();
    initScrollReveals();
    initForms();
    initSmoothScroll();
    initProjectLightbox();
  });

})();