function setHtml(selector, values) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element, index) => {
    if (values[index] !== undefined) element.innerHTML = values[index];
  });
}

function setPlaceholders(placeholders) {
  Object.entries(placeholders).forEach(([selector, value]) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.placeholder = value;
    });
  });
}

function applyStaticContent(language) {
  const locale = window.EsnaaData.getLocale();
  locale.static.forEach(([selector, values]) => setHtml(selector, values));
  setPlaceholders(locale.placeholders);

  document.title = locale.meta.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = locale.meta.description;
}

function updateLanguageControl(language) {
  const controls = window.EsnaaData.getMeta().controls;
  const toggle = document.getElementById('languageToggle');
  const faqFab = document.getElementById('faqFab');
  const chatComposer = document.getElementById('chatComposer');

  if (toggle) {
    toggle.textContent = controls.languageToggleText;
    toggle.setAttribute('aria-label', controls.languageToggleAria);
  }
  if (faqFab) faqFab.setAttribute('aria-label', controls.faqFabAria);
  const label = chatComposer?.querySelector('label');
  if (label) label.textContent = controls.chatLabel;
}

function applyLanguage(language, refresh = true) {
  window.EsnaaHalo?.resetHero();

  const nextLanguage = language === 'en' ? 'en' : 'ar';
  document.documentElement.lang = nextLanguage;
  document.documentElement.dir = nextLanguage === 'en' ? 'ltr' : 'rtl';

  applyStaticContent(nextLanguage);
  updateLanguageControl(nextLanguage);

  try {
    localStorage.setItem('esnaa-language', nextLanguage);
  } catch {
    // Storage can be unavailable in private/restricted browsing contexts.
  }

  if (!refresh) return;

  window.EsnaaRender.renderPage();
  window.EsnaaChat.resetChatForLanguage();
  window.EsnaaUi.refreshLanguageUi();
  window.EsnaaHalo?.resetServices?.();
  window.EsnaaHalo?.refresh();
}

function initLanguage() {
  const saved = (() => {
    try {
      return localStorage.getItem('esnaa-language');
    } catch {
      return null;
    }
  })();

  applyLanguage(saved || document.documentElement.lang || 'ar', false);

  document.getElementById('languageToggle')?.addEventListener('click', () => {
    applyLanguage(document.documentElement.lang === 'en' ? 'ar' : 'en');
  });
}

window.EsnaaLanguage = { initLanguage };
