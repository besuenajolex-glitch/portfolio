/* ==========================================================================
   Jolex Besuena Portfolio — Parallax, Motion & KCC Studio Controller
   ========================================================================== */

(() => {
  'use strict';

  const KCC_BASE_URL = 'https://besuenajolex-glitch.github.io/kcc/';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------------
     1. Scroll Progress Hairline, Header State & Smooth rAF Parallax
     ------------------------------------------------------------------------ */
  const scrollProgress = document.getElementById('scrollProgress');
  const siteHeader = document.getElementById('siteHeader');
  const parallaxItems = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => ({
    el,
    speed: parseFloat(el.dataset.parallax) || 0,
    currentY: 0,
  }));
  const mouseParallaxEl = document.querySelector('[data-mouse-parallax]');
  const timelineEl = document.getElementById('journeyTimeline');
  const timelineBeam = document.getElementById('timelineBeam');

  let pointerOffsetX = 0;
  let pointerOffsetY = 0;
  let currentPointerX = 0;
  let currentPointerY = 0;
  let rafScheduled = false;

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  function updateScrollMetrics() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? clamp(scrollY / docHeight, 0, 1) : 0;

    if (scrollProgress) {
      scrollProgress.style.transform = `scaleX(${progress})`;
    }

    if (siteHeader) {
      siteHeader.classList.toggle('is-scrolled', scrollY > 36);
    }

    if (timelineEl && timelineBeam) {
      const rect = timelineEl.getBoundingClientRect();
      const viewCenter = window.innerHeight * 0.65;
      const beamRatio = clamp((viewCenter - rect.top) / rect.height, 0, 1);
      timelineBeam.style.transform = `scaleY(${beamRatio})`;
    }
  }

  function renderParallaxFrame() {
    rafScheduled = false;
    if (prefersReducedMotion) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const viewMid = window.innerHeight / 2;
    let needsAnotherFrame = false;

    for (const item of parallaxItems) {
      const rect = item.el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const distanceFromCenter = elCenter - viewMid;
      const targetY = item.el.closest('.hero')
        ? scrollY * item.speed
        : distanceFromCenter * item.speed * -0.45;

      item.currentY += (targetY - item.currentY) * 0.14;
      if (Math.abs(targetY - item.currentY) > 0.15) {
        needsAnotherFrame = true;
      }

      if (item.el === mouseParallaxEl) {
        currentPointerX += (pointerOffsetX - currentPointerX) * 0.08;
        currentPointerY += (pointerOffsetY - currentPointerY) * 0.08;
        if (
          Math.abs(pointerOffsetX - currentPointerX) > 0.1 ||
          Math.abs(pointerOffsetY - currentPointerY) > 0.1
        ) {
          needsAnotherFrame = true;
        }
        item.el.style.transform = `translate3d(${currentPointerX.toFixed(2)}px, ${(item.currentY + currentPointerY).toFixed(2)}px, 0)`;
      } else {
        item.el.style.transform = `translate3d(0, ${item.currentY.toFixed(2)}px, 0)`;
      }
    }

    if (needsAnotherFrame) {
      scheduleParallax();
    }
  }

  function scheduleParallax() {
    if (!rafScheduled && !prefersReducedMotion) {
      rafScheduled = true;
      window.requestAnimationFrame(renderParallaxFrame);
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      updateScrollMetrics();
      scheduleParallax();
    },
    { passive: true }
  );

  if (isFinePointer && !prefersReducedMotion && mouseParallaxEl) {
    const maxShift = parseFloat(mouseParallaxEl.dataset.mouseParallax) || 20;
    window.addEventListener(
      'mousemove',
      (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        pointerOffsetX = nx * maxShift;
        pointerOffsetY = ny * maxShift;
        scheduleParallax();
      },
      { passive: true }
    );
  }

  updateScrollMetrics();
  scheduleParallax();

  /* ------------------------------------------------------------------------
     2. Scroll Reveal, Active Nav Spy, Animated Counters & Skill Bars
     ------------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const counterEls = document.querySelectorAll('[data-counter]');
  const skillBarEls = document.querySelectorAll('[data-skill-bar]');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-nav]');

  function animateCounter(el) {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';

    const target = parseInt(el.dataset.counter, 10) || 0;
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const t = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(target * eased);
      el.textContent = `${current}${suffix}`;
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px 0px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counterEls.forEach((el) => counterObserver.observe(el));

    const skillObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pct = clamp(parseInt(entry.target.dataset.skillBar, 10) || 0, 0, 100);
            entry.target.style.width = `${pct}%`;
            skillObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    skillBarEls.forEach((el) => skillObserver.observe(el));

    const navSpyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.nav === id);
          });
        });
      },
      { rootMargin: '-42% 0px -48% 0px' }
    );
    sections.forEach((sec) => navSpyObserver.observe(sec));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    counterEls.forEach((el) => animateCounter(el));
    skillBarEls.forEach((el) => {
      el.style.width = `${el.dataset.skillBar}%`;
    });
  }

  /* ------------------------------------------------------------------------
     3. Spotlight Cursor Glow, 3D Tilt & Magnetic Buttons
     ------------------------------------------------------------------------ */
  if (isFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.spotlight-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });

    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotateY = x * 6;
        const rotateX = -y * 6;
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------------
     4. Mobile Frosted Drawer Menu
     ------------------------------------------------------------------------ */
  const navToggle = document.getElementById('navToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  function setDrawerOpen(open) {
    if (!navToggle || !mobileDrawer) return;
    navToggle.setAttribute('aria-expanded', String(open));
    mobileDrawer.setAttribute('aria-hidden', String(!open));
    mobileDrawer.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  if (navToggle && mobileDrawer) {
    navToggle.addEventListener('click', () => {
      const next = !mobileDrawer.classList.contains('is-open');
      setDrawerOpen(next);
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setDrawerOpen(false));
    });
  }

  /* ------------------------------------------------------------------------
     5. KCC Interactive Safari Studio Controls
     ------------------------------------------------------------------------ */
  const studioWindow = document.getElementById('studioWindow');
  const kccFrame = document.getElementById('kccFrame');
  const iframeLoader = document.getElementById('iframeLoader');
  const studioUrlText = document.getElementById('studioUrlText');
  const openExternalBtn = document.getElementById('openExternalBtn');
  const interactBtn = document.getElementById('interactBtn');
  const exitInteractBtn = document.getElementById('exitInteractBtn');
  const reloadFrameBtn = document.getElementById('reloadFrameBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenLabel = document.getElementById('fullscreenLabel');
  const studioStatusLabel = document.getElementById('studioStatusLabel');
  const viewportBtns = document.querySelectorAll('[data-viewport-btn]');
  const pageTabs = document.querySelectorAll('[data-kcc-page]');

  let currentPage = 'index.html';
  let loaderFallbackTimer = null;

  function showLoader() {
    if (!iframeLoader) return;
    iframeLoader.classList.remove('is-hidden');
    clearTimeout(loaderFallbackTimer);
    loaderFallbackTimer = setTimeout(() => {
      iframeLoader.classList.add('is-hidden');
    }, 4500);
  }

  function hideLoader() {
    if (!iframeLoader) return;
    clearTimeout(loaderFallbackTimer);
    iframeLoader.classList.add('is-hidden');
  }

  function setInteractiveMode(active) {
    if (!studioWindow) return;
    studioWindow.classList.toggle('is-interactive', active);
    if (exitInteractBtn) {
      exitInteractBtn.classList.toggle('chrome-btn--hidden', !active);
    }
    if (studioStatusLabel) {
      studioStatusLabel.textContent = active
        ? 'Interactive mode active • Scroll inside site'
        : 'Scroll-safe mode • Click below to browse';
    }
  }

  function setFullscreenMode(active) {
    if (!studioWindow) return;
    studioWindow.classList.toggle('is-fullscreen', active);
    document.body.classList.toggle('modal-open', active);
    if (fullscreenBtn) {
      fullscreenBtn.setAttribute('aria-pressed', String(active));
    }
    if (fullscreenLabel) {
      fullscreenLabel.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
    }
    if (active) {
      setInteractiveMode(true);
    }
  }

  function navigateKccPage(pageFile) {
    if (!kccFrame) return;
    currentPage = pageFile;
    const targetUrl = `${KCC_BASE_URL}${pageFile}`;
    showLoader();
    kccFrame.src = targetUrl;
    if (studioUrlText) {
      studioUrlText.textContent = `besuenajolex-glitch.github.io/kcc/${pageFile}`;
    }
    if (openExternalBtn) {
      openExternalBtn.href = targetUrl;
    }
    pageTabs.forEach((tab) => {
      const selected = tab.dataset.kccPage === pageFile;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
  }

  if (kccFrame) {
    showLoader();
    kccFrame.addEventListener('load', hideLoader);
  }

  viewportBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.viewportBtn;
      if (!studioWindow || !mode) return;
      studioWindow.setAttribute('data-viewport', mode);
      viewportBtns.forEach((other) => {
        const isCurrent = other === btn;
        other.classList.toggle('is-active', isCurrent);
        other.setAttribute('aria-pressed', String(isCurrent));
      });
    });
  });

  pageTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const page = tab.dataset.kccPage;
      if (page) navigateKccPage(page);
    });
  });

  if (interactBtn) {
    interactBtn.addEventListener('click', () => setInteractiveMode(true));
  }

  if (exitInteractBtn) {
    exitInteractBtn.addEventListener('click', () => setInteractiveMode(false));
  }

  if (reloadFrameBtn && kccFrame) {
    reloadFrameBtn.addEventListener('click', () => {
      showLoader();
      kccFrame.src = `${KCC_BASE_URL}${currentPage}`;
    });
  }

  if (fullscreenBtn && studioWindow) {
    fullscreenBtn.addEventListener('click', () => {
      const isFull = studioWindow.classList.contains('is-fullscreen');
      setFullscreenMode(!isFull);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (studioWindow && studioWindow.classList.contains('is-fullscreen')) {
      setFullscreenMode(false);
    }
    if (mobileDrawer && mobileDrawer.classList.contains('is-open')) {
      setDrawerOpen(false);
    }
  });

  /* ------------------------------------------------------------------------
     6. Toast Feedback, Copy Email & Contact Form Validation
     ------------------------------------------------------------------------ */
  const toastEl = document.getElementById('toast');
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2800);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = copyEmailBtn.dataset.email || 'jolex.besuena@example.com';
      try {
        await navigator.clipboard.writeText(email);
        showToast(`Copied ${email} to clipboard`);
      } catch {
        const tempInput = document.createElement('input');
        tempInput.value = email;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast(`Copied ${email}`);
      }
    });
  }

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      const messageInput = document.getElementById('contactMessage');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      formStatus.classList.remove('is-success');

      if (!name || !email || !message) {
        formStatus.textContent = 'Please fill in your name, email address, and message.';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formStatus.textContent = 'Please enter a valid email address.';
        return;
      }

      formStatus.classList.add('is-success');
      formStatus.textContent = `Thanks, ${name}! Your message is ready — feel free to also connect via GitHub.`;
      showToast('Message confirmed!');
      contactForm.reset();
    });
  }
})();
