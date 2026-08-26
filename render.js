const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

function renderProjects() {
  const workGrid = document.getElementById('workGrid');
  const { projects, copy } = window.EsnaaData.getContent();
  workGrid.innerHTML = '';
  projects.forEach((project, index) => {
    const card = document.createElement('article');
    card.className = 'work-card reveal';
    card.innerHTML = `
      <div class="work-info">
        <div class="eyebrow">${project.category}</div>
        <h3>${project.name}</h3>
        <p class="desc">${project.desc}</p>
        <div class="work-tags">${project.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
        <a href="#contact" class="btn btn-ghost">${copy.projectCta} ${arrowIcon}</a>
      </div>
      <div class="work-preview" data-project="${project.id}">
        <div class="browser-chrome"><div class="browser-bar"><i></i><i></i><i></i></div><div class="preview-viewport"><div class="preview-canvas"><iframe title="معاينة مشروع ${project.name}" loading="lazy" tabindex="-1"></iframe></div></div></div>
        <div class="case-study-readout" aria-hidden="true"><span>${copy.caseStudyLabel}</span><b>0${index + 1}</b><div class="case-study-progress"><i></i></div></div>
        <div class="preview-hint">${arrowIcon} ${copy.previewHint}</div>
      </div>`;
    workGrid.appendChild(card);

    const template = document.getElementById(`preview-${project.id}`);
    if (template) card.querySelector('iframe').srcdoc = template.innerHTML;
  });
}

function renderServices() {
  const servicesGrid = document.getElementById('servicesGrid');
  const { services } = window.EsnaaData.getContent();
  servicesGrid.innerHTML = '';
  services.forEach((service, index) => {
    const card = document.createElement('article');
    card.className = 'service-card';
    card.innerHTML = `<div class="service-num">${String(index + 1).padStart(2, '0')}</div><h3>${service.title}</h3><p>${service.text}</p>`;
    servicesGrid.appendChild(card);
  });
}

function renderPricing() {
  const pricingGrid = document.getElementById('pricingGrid');
  const { pricing, copy } = window.EsnaaData.getContent();
  pricingGrid.innerHTML = '';
  pricing.forEach((plan) => {
    const card = document.createElement('article');
    card.className = `price-card${plan.featured ? ' featured' : ''}`;
    card.innerHTML = `
      <h3>${plan.name}</h3>
      <p class="price-desc">${plan.desc}</p>
      <div class="price-value">${plan.priceValue}</div>
      <div class="price-note">${plan.priceNote}</div>
      <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
      <a href="#contact" class="btn ${plan.featured ? 'btn-primary' : 'btn-ghost'}">${copy.quoteCta}</a>`;
    pricingGrid.appendChild(card);
  });
}

function renderPage() {
  renderProjects();
  renderServices();
  renderPricing();
}

window.EsnaaRender = { renderPage };
