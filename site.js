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

  function rewriteRootRelativeUrlsForFileProtocol() {
    if (window.location.protocol !== 'file:') return;

    var currentPath = window.location.pathname.replace(/\\/g, '/');
    var prefix = currentPath.indexOf('/projects/') !== -1 ? '../' : '';

    [
      ['href', 'a[href^="/"]'],
      ['href', 'link[href^="/"]'],
      ['src', 'img[src^="/"]'],
      ['src', 'script[src^="/"]'],
      ['src', 'source[src^="/"]'],
      ['src', 'video[src^="/"]'],
      ['poster', 'video[poster^="/"]'],
      ['action', 'form[action^="/"]']
    ].forEach(function (entry) {
      var attribute = entry[0];
      var selector = entry[1];

      $$(selector).forEach(function (node) {
        var value = node.getAttribute(attribute);

        if (!value || value.indexOf('//') === 0 || value.indexOf('mailto:') === 0 || value.indexOf('tel:') === 0) {
          return;
        }

        node.setAttribute(attribute, prefix + value.slice(1));
      });
    });
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
    var dropdownItem    = overlay.querySelector('.site-nav__item--has-dropdown');
    var dropdownTrigger = overlay.querySelector('.site-nav__dropdown-trigger');
    var dropdownPanel   = overlay.querySelector('.site-nav__dropdown');

    function setMobileDropdown(open) {
      if (!dropdownTrigger || !dropdownPanel || !dropdownItem) return;
      dropdownItem.classList.toggle('is-open', open);
      dropdownPanel.hidden = !open;
      dropdownTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (dropdownTrigger && dropdownPanel) {
      dropdownTrigger.setAttribute('aria-haspopup', 'true');
      setMobileDropdown(false);

      dropdownTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        setMobileDropdown(dropdownPanel.hidden);
      });

      dropdownTrigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setMobileDropdown(dropdownPanel.hidden);
        }
        if (e.key === 'Escape') {
          setMobileDropdown(false);
        }
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
      firstFocusable = null;
      lastFocusable = null;
      setMobileDropdown(false);
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
      if (a === dropdownTrigger) return;
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

    function isTouchMode() {
      return window.matchMedia('(hover: none), (pointer: coarse)').matches;
    }

    function close(item) {
      var trigger = item.querySelector('.site-nav__dropdown-trigger');
      if (!trigger) return;
      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function closeAll(exceptItem) {
      items.forEach(function (item) {
        if (item !== exceptItem) close(item);
      });
    }

    function open(item) {
      var trigger = item.querySelector('.site-nav__dropdown-trigger');
      if (!trigger) return;
      closeAll(item);
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    items.forEach(function (item) {
      var trigger = item.querySelector('.site-nav__dropdown-trigger');
      var panel   = item.querySelector('.site-nav__dropdown');
      var links;

      if (!trigger || !panel) return;

      links = $$('a', panel);
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      item.addEventListener('mouseenter', function () {
        if (!isTouchMode()) open(item);
      });

      item.addEventListener('mouseleave', function () {
        if (!isTouchMode()) close(item);
      });

      trigger.addEventListener('click', function (e) {
        var isOpen = item.classList.contains('is-open');

        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        if (isTouchMode()) {
          e.preventDefault();
          isOpen ? close(item) : open(item);
        }
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          open(item);
          if (links[0]) links[0].focus();
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          open(item);
          if (links.length) links[links.length - 1].focus();
        }

        if (e.key === 'Escape') {
          close(item);
          trigger.focus();
        }
      });

      panel.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          close(item);
          trigger.focus();
        }
      });

      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) close(item);
      });
    });

    document.addEventListener('click', function (e) {
      items.forEach(function (item) {
        if (!item.contains(e.target)) close(item);
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
     6. HOMEPAGE TESTIMONIALS ROTATOR
     ─────────────────────────────────────────────────────────
     Shuffles testimonial order on each page load, then rotates
     through them automatically with manual controls.
  ========================================================= */

  function initHomeTestimonials() {
    var root = $('[data-home-testimonials]');
    if (!root) return;

    var textEl = $('[data-home-testimonial-text]', root);
    var authorEl = $('[data-home-testimonial-author]', root);
    var sourceEl = $('[data-home-testimonial-source]', root);
    var dateEl = $('[data-home-testimonial-date]', root);
    var dotsWrap = $('[data-home-testimonial-dots]', root);
    var prevBtn = $('[data-home-testimonial-prev]', root);
    var nextBtn = $('[data-home-testimonial-next]', root);

    if (!textEl || !authorEl || !sourceEl || !dateEl || !dotsWrap) return;

    var testimonials = [
      {
        author: 'Patrick Battersby',
        source: 'Google',
        date: '1 year ago',
        text: 'There are carpenters and then there are professional woodworking craftsmen. Michael Britten is a professional craftsman. I would recommend Britten Woodworking to anyone looking for high quality craftsmanship.'
      },
      {
        author: 'Albert Hofmann',
        source: 'Google',
        date: '2 years ago',
        text: 'Mike did a super job making our front door. He understood exactly what we wanted. Wonderful work. We\'d definitely get him again for another project.'
      },
      {
        author: 'Mary Lou Shefrin',
        source: 'Google',
        date: '2 years ago',
        text: 'Mike is probably the most talented woodworker I have ever seen. His vision and input is inspiring and his attention to detail is meticulous. Very highly recommended!'
      },
      {
        author: 'DaBrode',
        source: 'Google',
        date: '1 year ago',
        text: 'Britten came through in a pinch when my business needed it. They nailed the design I was asking for, making my office a pleasure to be in.'
      },
      {
        author: 'Andy Shefrin',
        source: 'Facebook',
        date: 'Recommendation',
        text: 'He did a great job on some very hard work for me and his rates are real good. Glad to know Mike. Great guy.'
      }
    ];

    function shuffle(list) {
      var arr = list.slice();
      for (var i = arr.length - 1; i > 0; i -= 1) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    var ordered = shuffle(testimonials);
    var index = 0;
    var timer = null;
    var intervalMs = 6500;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setDotsActive(activeIndex) {
      $$('button', dotsWrap).forEach(function (dot, i) {
        var isActive = i === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function render(activeIndex) {
      var item = ordered[activeIndex];

      root.classList.add('is-transitioning');
      window.setTimeout(function () {
        textEl.textContent = item.text;
        authorEl.textContent = item.author;
        sourceEl.textContent = item.source;
        dateEl.textContent = item.date;
        sourceEl.classList.toggle('home-testimonials__source--fb', item.source === 'Facebook');
        setDotsActive(activeIndex);
        root.classList.remove('is-transitioning');
      }, reducedMotion ? 0 : 170);
    }

    function goTo(nextIndex) {
      index = (nextIndex + ordered.length) % ordered.length;
      render(index);
    }

    function start() {
      if (reducedMotion) return;
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, intervalMs);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    dotsWrap.innerHTML = '';
    ordered.forEach(function (item, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'home-testimonials__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1) + ' from ' + item.author);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', function () {
        goTo(i);
        start();
      });
      dotsWrap.appendChild(dot);
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goTo(index - 1);
        start();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goTo(index + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) start();
    });

    render(index);
    start();
  }

  /* =========================================================
     7. PROJECT GALLERY LIGHTBOX
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

  rewriteRootRelativeUrlsForFileProtocol();

  onReady(function () {
    initMobileNav();
    initDesktopDropdown();
    initScrollReveals();
    initForms();
    initSmoothScroll();
    initHomeTestimonials();
    initProjectLightbox();
  });

})();