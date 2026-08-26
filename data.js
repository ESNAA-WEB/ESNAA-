(function () {
  const I18N = window.EsnaaI18n;

  if (!I18N?.ar || !I18N?.en) {
    console.error('Esnaa i18n data is missing. Load js/i18n/ar.js and js/i18n/en.js before data.js.');
    return;
  }

  function getLanguage() {
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
  }

  function getLocale() {
    return I18N[getLanguage()];
  }

  function getContent() {
    return getLocale().content;
  }

  function getStatic() {
    return getLocale().static;
  }

  function getPlaceholders() {
    return getLocale().placeholders;
  }

  function getMeta() {
    return getLocale().meta;
  }

  window.EsnaaData = {
    getContent,
    getLanguage,
    getLocale,
    getMeta,
    getPlaceholders,
    getStatic,
  };
})();
