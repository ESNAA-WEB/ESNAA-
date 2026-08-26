const { closeChat: closeFaqChat } = window.EsnaaChat;

function isEnglish() { return document.documentElement.lang === 'en'; }

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#101116' : '#F6F4EF');
  const toggle = document.getElementById('themeToggle');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isEnglish() ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : (isDark ? 'فعّل الوضع الفاتح' : 'فعّل الوضع الداكن'));
  try { localStorage.setItem('esnaa-theme', theme); } catch { /* Storage can be unavailable in private contexts. */ }
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const savedTheme = (() => { try { return localStorage.getItem('esnaa-theme'); } catch { return null; } })();
  applyTheme(savedTheme || document.documentElement.dataset.theme || 'light');
  document.getElementById('themeToggle').onclick = toggleTheme;
}

function initNavigation() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  let navFrame = null;
  const updateNav = () => {
    navFrame = null;
    nav.classList.toggle('scrolled', window.scrollY > 30);
  };
  const queueNavUpdate = () => {
    if (navFrame) return;
    navFrame = requestAnimationFrame(updateNav);
  };
  const closeMobileMenu = () => {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  updateNav();
  window.addEventListener('scroll', queueNavUpdate, { passive: true });
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));
}

function initHeroMotion() {
  const hero = document.querySelector('.hero');
  const mark = document.getElementById('heroMark');
  if (!hero || !mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let pointerOffset = 0;
  let frame = null;
  const updateMark = () => {
    frame = null;
    const scrollOffset = Math.min(window.scrollY * 0.12, 80);
    mark.style.transform = `translate(${pointerOffset}px, ${scrollOffset}px)`;
  };
  const queueUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateMark);
  };
  window.addEventListener('scroll', queueUpdate, { passive: true });
  hero.addEventListener('mousemove', (event) => {
    const bounds = hero.getBoundingClientRect();
    pointerOffset = (((event.clientX - bounds.left) / bounds.width) - 0.5) * 28;
    queueUpdate();
  });
  hero.addEventListener('mouseleave', () => { pointerOffset = 0; queueUpdate(); });
  updateMark();
}

function initWorkPreviews() {
  if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.work-card').forEach((card) => {
    if (card.dataset.tiltInitialized === 'true') return;
    card.dataset.tiltInitialized = 'true';
    let tiltFrame = null;
    let tiltX = 0;
    let tiltY = 0;
    const renderTilt = () => {
      tiltFrame = null;
      card.style.transform = `perspective(1400px) rotateX(${(-tiltY * 1.6).toFixed(2)}deg) rotateY(${(tiltX * 1.6).toFixed(2)}deg)`;
      card.classList.add('is-tilting');
    };
    card.addEventListener('mousemove', (event) => {
      const bounds = card.getBoundingClientRect();
      tiltX = (event.clientX - bounds.left) / bounds.width - 0.5;
      tiltY = (event.clientY - bounds.top) / bounds.height - 0.5;
      if (!tiltFrame) tiltFrame = requestAnimationFrame(renderTilt);
    });
    card.addEventListener('mouseleave', () => {
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      tiltFrame = null;
      card.style.transform = '';
      card.classList.remove('is-tilting');
    });
  });
}

function initLeadForm() {
  const form = document.getElementById('leadForm');
  const success = document.getElementById('formSuccess');

  if (!form || !success) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const honeypot = form.querySelector('input[name="botcheck"]');
    if (honeypot?.checked) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.textContent = isEnglish() ? 'Sending...' : 'جاري الإرسال...';

    try {
      const formData = new FormData(form);
      const payload = {
        name: formData.get('name') || '',
        business: formData.get('business') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        type: formData.get('type') || '',
        budget: formData.get('budget') || '',
        message: formData.get('message') || '',
      };

      const apiBase = window.ESNAA_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        form.style.display = 'none';
        success.classList.add('show');
      } else {
        throw new Error(result.message || 'Form submission failed');
      }

    } catch (error) {
      console.error('Contact form submission error:', error);

      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;

      alert(
        isEnglish()
          ? 'Something went wrong. Please try again.'
          : 'حصلت مشكلة أثناء الإرسال. حاول تاني من فضلك.'
      );
    }
  });
}

let revealObserver = null;
function initReveal() {
  const elements = document.querySelectorAll('.reveal:not([data-reveal-observed])');
  if (!elements.length) return;
  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => {
      element.classList.add('is-visible');
      element.dataset.revealObserved = 'true';
    });
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
  }
  elements.forEach((element) => {
    element.dataset.revealObserved = 'true';
    revealObserver.observe(element);
  });
}

function initKeyboardAndOutsideClick() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeFaqChat();
  });
  document.addEventListener('click', (event) => {
    const panel = document.getElementById('faqPanel');
    const fab = document.getElementById('faqFab');
    if (panel.classList.contains('open') && !panel.contains(event.target) && !fab.contains(event.target) && !event.target.closest('[data-open-chat]')) closeFaqChat();
  });
}

function initUi() {
  initTheme();
  initNavigation();
  initHeroMotion();
  initWorkPreviews();
  initLeadForm();
  initReveal();
  initKeyboardAndOutsideClick();
  document.getElementById('year').textContent = new Date().getFullYear();
}

function refreshLanguageUi() {
  applyTheme(document.documentElement.dataset.theme || 'light');
  initWorkPreviews();
  initReveal();
  document.getElementById('year').textContent = new Date().getFullYear();
}

window.EsnaaUi = { initUi, refreshLanguageUi, toggleTheme };
