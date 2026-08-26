(() => {
  try {
    const theme = localStorage.getItem('esnaa-theme');
    const language = localStorage.getItem('esnaa-language');
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.lang = language === 'en' ? 'en' : 'ar';
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }
})();
