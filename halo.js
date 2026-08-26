/* Halo-inspired interaction layer for Esnaa. No external dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktopMotion = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)').matches;
  const lerp = (from, to, amount) => from + (to - from) * amount;
  let servicesController = null;
  let choreographyObserver = null;
  let caseStudyCleanup = null;
  let tickerCleanup = null;
  let updateKineticArtwork = null;
  let updateServicesArtwork = null;

  function getHeroTitle() {
    return document.querySelector('.hero h1');
  }

  // Restore the source before language.js swaps its content. This prevents
  // translated markup from retaining animation wrappers from the prior locale.
  function resetHero() {
    const title = getHeroTitle();
    if (!title || !title.dataset.haloSource) return;
    title.innerHTML = title.dataset.haloSource;
    title.removeAttribute('aria-label');
    delete title.dataset.haloSource;
    root.classList.remove('halo-hero-ready');
  }

  function prepareHero() {
    const title = getHeroTitle();
    if (!title || title.dataset.haloSource) return;

    const source = title.innerHTML;
    const label = title.textContent.replace(/\s+/g, ' ').trim();
    const fragment = document.createDocumentFragment();
    let line = document.createElement('span');
    let lineIndex = 0;

    const flushLine = () => {
      if (!line.childNodes.length) return;
      const clip = document.createElement('span');
      clip.className = 'halo-hero-line-clip';
      line.className = 'halo-hero-line';
      line.style.setProperty('--halo-line-index', lineIndex++);
      line.setAttribute('aria-hidden', 'true');
      clip.append(line);
      fragment.append(clip);
      line = document.createElement('span');
    };

    Array.from(title.childNodes).forEach((node) => {
      if (node.nodeName === 'BR') flushLine();
      else line.append(node);
    });
    flushLine();
    if (!lineIndex) return;

    title.dataset.haloSource = source;
    title.replaceChildren(fragment);
    title.setAttribute('aria-label', label);
    root.classList.remove('halo-hero-ready');
    if (!reducedMotion) requestAnimationFrame(() => root.classList.add('halo-hero-ready'));
  }

  function initPointerEffects() {
    if (reducedMotion || !finePointer) return;

    const cursor = document.createElement('div');
    cursor.className = 'halo-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);

    const follower = document.createElement('div');
    follower.className = 'halo-work-follower';
    follower.setAttribute('aria-hidden', 'true');
    const followerInner = document.createElement('div');
    followerInner.className = 'halo-work-follower__inner';
    const followerFrame = document.createElement('iframe');
    followerFrame.tabIndex = -1;
    followerFrame.setAttribute('sandbox', '');
    followerFrame.setAttribute('loading', 'lazy');
    followerInner.append(followerFrame);
    follower.append(followerInner);
    document.body.append(follower);
    root.classList.add('has-halo-cursor');

    const pointer = { x: -120, y: -120, cursorX: -120, cursorY: -120, previewX: -120, previewY: -120 };
    let activeMagnet = null;
    let activeCard = null;
    let renderedPreview = '';
    let framePending = false;

    const resolveMagnet = (node) => node instanceof Element ? node.closest('.btn, .work-card') : null;
    const resolveCard = (node) => node instanceof Element ? node.closest('.work-card') : null;
    const queueRender = () => {
      if (!framePending) {
        framePending = true;
        requestAnimationFrame(render);
      }
    };
    const render = () => {
      framePending = false;
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (activeMagnet) {
        const rect = activeMagnet.getBoundingClientRect();
        targetX = lerp(pointer.x, rect.left + rect.width / 2, .24);
        targetY = lerp(pointer.y, rect.top + rect.height / 2, .24);
      }
      pointer.cursorX = lerp(pointer.cursorX, targetX, .22);
      pointer.cursorY = lerp(pointer.cursorY, targetY, .22);
      cursor.style.transform = `translate3d(${pointer.cursorX}px, ${pointer.cursorY}px, 0) translate3d(-50%, -50%, 0)`;

      if (activeCard) {
        pointer.previewX = lerp(pointer.previewX, pointer.x + 26, .18);
        pointer.previewY = lerp(pointer.previewY, pointer.y + 26, .18);
        follower.style.transform = `translate3d(${pointer.previewX}px, ${pointer.previewY}px, 0)`;
      }

      const cursorStillMoving = Math.abs(pointer.cursorX - targetX) > .1 || Math.abs(pointer.cursorY - targetY) > .1;
      const previewStillMoving = activeCard && (Math.abs(pointer.previewX - (pointer.x + 26)) > .1 || Math.abs(pointer.previewY - (pointer.y + 26)) > .1);
      if (cursorStillMoving || previewStillMoving) queueRender();
    };
    const setMagnet = (element) => {
      activeMagnet = element;
      cursor.classList.toggle('is-magnetic', Boolean(element));
      cursor.classList.toggle('is-work', Boolean(element?.matches('.work-card')));
    };
    const setPreviewCard = (card) => {
      activeCard = card;
      if (!card) {
        follower.classList.remove('is-visible');
        return;
      }
      const source = card.querySelector('.work-preview iframe')?.srcdoc || '';
      if (!source) return;
      if (source !== renderedPreview) {
        followerFrame.srcdoc = source;
        renderedPreview = source;
      }
      follower.classList.add('is-visible');
    };

    document.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      cursor.classList.add('is-visible');
      queueRender();
    }, { passive: true });
    document.addEventListener('pointerover', (event) => {
      setMagnet(resolveMagnet(event.target));
      const card = resolveCard(event.target);
      if (card !== activeCard) setPreviewCard(card);
    });
    document.addEventListener('pointerout', (event) => {
      const nextMagnet = resolveMagnet(event.relatedTarget);
      if (nextMagnet !== activeMagnet) setMagnet(nextMagnet);
      const nextCard = resolveCard(event.relatedTarget);
      if (nextCard !== activeCard) setPreviewCard(nextCard);
    });
    window.addEventListener('blur', () => {
      cursor.classList.remove('is-visible');
      setMagnet(null);
      setPreviewCard(null);
    });
  }

  function initServicesScroll() {
    if (!desktopMotion || servicesController) return;
    const section = document.getElementById('services');
    const grid = document.getElementById('servicesGrid');
    if (!section || !grid) return;

    const stage = document.createElement('div');
    stage.className = 'services-scroll-stage';
    const sticky = document.createElement('div');
    sticky.className = 'services-scroll-sticky';
    grid.parentElement.insertBefore(stage, grid);
    stage.append(sticky);
    sticky.append(grid);
    grid.classList.remove('reveal');
    grid.classList.add('is-visible');

    let distance = 0;
    let active = false;
    let updateQueued = false;
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const update = (force = false) => {
      updateQueued = false;
      if (!active && !force) return;
      const progress = clamp(-stage.getBoundingClientRect().top / Math.max(distance, 1));
      grid.style.transform = `translate3d(${-distance * progress}px, 0, 0)`;
    };
    const queueUpdate = (force = false) => {
      if (updateQueued) return;
      updateQueued = true;
      requestAnimationFrame(() => update(force));
    };
    const measure = () => {
      distance = Math.max(0, grid.scrollWidth - sticky.clientWidth);
      // The stage consumes exactly one viewport for the pin plus the full
      // horizontal travel distance. Vertical page scrolling resumes only
      // after the last service card has crossed the frame.
      stage.style.setProperty('--services-scroll-height', `${Math.ceil(Math.max(window.innerHeight, distance + window.innerHeight))}px`);
      queueUpdate(true);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        active = entries[0].isIntersecting;
        if (active) queueUpdate();
      }, { rootMargin: '55% 0px' });
      observer.observe(stage);
    } else {
      active = true;
    }
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(grid);
    window.addEventListener('scroll', () => queueUpdate(), { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    servicesController = {
      measure: () => requestAnimationFrame(measure),
      reset: () => {
        grid.style.transform = 'translate3d(0, 0, 0)';
        requestAnimationFrame(measure);
      },
    };
    measure();
  }

  // Put the case studies immediately after the introduction, followed by
  // the proof-point bento. This gives the page a portfolio-first agency flow.
  function organisePage() {
    const work = document.getElementById('work');
    const glance = document.getElementById('glance');
    if (!work || !glance || work.nextElementSibling === glance) return;
    work.after(glance);
  }

  // A single observer keeps the editorial entrances inexpensive. New work
  // cards are rendered on a language change, so refresh() observes only ones
  // that were not prepared already.
  function initScrollChoreography() {
    const items = document.querySelectorAll('#work .work-card, #glance .bento-tile, .process-item, .price-card');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('halo-in-view'));
      return;
    }
    if (!choreographyObserver) {
      choreographyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('halo-in-view');
          choreographyObserver.unobserve(entry.target);
        });
      }, { threshold: .12, rootMargin: '0px 0px -6%' });
    }
    items.forEach((item, index) => {
      if (item.dataset.haloChoreographed) return;
      item.dataset.haloChoreographed = 'true';
      item.classList.add('halo-entrance');
      item.style.setProperty('--halo-entrance-delay', `${Math.min(index % 4, 3) * 75}ms`);
      choreographyObserver.observe(item);
    });
  }

  // A read-only but alive case-study mode: each mock website advances through
  // its own page as the visitor moves down Esnaa, then follows the cursor when
  // the visitor lingers over the preview. No iframe links are exposed.
  function initCaseStudyShowcase() {
    caseStudyCleanup?.();
    const states = Array.from(document.querySelectorAll('#work .work-card')).map((card) => {
      const preview = card.querySelector('.work-preview');
      const viewport = card.querySelector('.preview-viewport');
      const canvas = card.querySelector('.preview-canvas');
      const iframe = card.querySelector('iframe');
      if (!preview || !viewport || !canvas || !iframe) return null;
      preview.classList.add('halo-case-media', 'is-case-study');
      return { card, preview, viewport, canvas, iframe, visible: false, hovering: false, current: 0, target: 0, scale: 1, virtualHeight: 2800, startedAt: 0 };
    }).filter(Boolean);
    if (!states.length || reducedMotion) return;

    let frame = null;
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const measureState = (state) => {
      const virtualWidth = state.viewport.clientWidth < 560 ? 960 : 1280;
      state.scale = state.viewport.clientWidth / virtualWidth;
      state.virtualHeight = state.viewport.clientWidth < 560 ? 2350 : 2800;
      state.canvas.style.width = `${virtualWidth}px`;
      state.canvas.style.height = `${state.virtualHeight}px`;
    };
    const queueUpdate = () => {
      if (document.hidden || frame) return;
      frame = requestAnimationFrame(update);
    };
    const update = (time) => {
      frame = null;
      let needsAnotherFrame = false;
      states.forEach((state) => {
        if (!state.visible && !state.hovering) return;
        const maxOffset = Math.max(0, state.virtualHeight * state.scale - state.viewport.offsetHeight);
        if (!state.hovering) {
          const elapsed = Math.max(0, time - state.startedAt) / 18000 + states.indexOf(state) * .19;
          const loop = elapsed % 2;
          const tour = loop <= 1 ? loop : 2 - loop;
          state.target = -maxOffset * (.035 + tour * .93);
        }
        state.current = lerp(state.current, state.target, .055);
        state.canvas.style.transform = `translate3d(0, ${state.current}px, 0) scale(${state.scale})`;
        state.preview.style.setProperty('--case-progress', String(maxOffset ? Math.abs(state.current / maxOffset) : 0));
        if (state.visible || Math.abs(state.current - state.target) > .25) needsAnotherFrame = true;
      });
      if (needsAnotherFrame) queueUpdate();
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = entry.target.__esnaaCaseState;
        state.visible = entry.isIntersecting;
        if (entry.isIntersecting && !state.startedAt) state.startedAt = performance.now();
      });
      queueUpdate();
    }, { threshold: 0, rootMargin: '20% 0px 20%' }) : null;

    states.forEach((state) => {
      state.card.__esnaaCaseState = state;
      measureState(state);
      if (observer) observer.observe(state.card);
      else { state.visible = true; state.startedAt = performance.now(); }
      state.preview.addEventListener('pointerenter', state.onEnter = () => { state.hovering = true; queueUpdate(); });
      state.preview.addEventListener('pointermove', state.onMove = (event) => {
        const bounds = state.viewport.getBoundingClientRect();
        const position = clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1));
        state.target = -Math.max(0, state.virtualHeight * state.scale - state.viewport.offsetHeight) * position;
        queueUpdate();
      }, { passive: true });
      state.preview.addEventListener('pointerleave', state.onLeave = () => { state.hovering = false; queueUpdate(); });
    });
    window.addEventListener('scroll', queueUpdate, { passive: true });
    const onResize = () => { states.forEach(measureState); queueUpdate(); };
    window.addEventListener('resize', onResize, { passive: true });
    const onVisibilityChange = () => { if (!document.hidden) queueUpdate(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    queueUpdate();

    caseStudyCleanup = () => {
      observer?.disconnect();
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (frame) cancelAnimationFrame(frame);
      states.forEach((state) => {
        state.preview.removeEventListener('pointerenter', state.onEnter);
        state.preview.removeEventListener('pointermove', state.onMove);
        state.preview.removeEventListener('pointerleave', state.onLeave);
        delete state.card.__esnaaCaseState;
      });
    };
  }

  // The ticker is driven by requestAnimationFrame rather than a CSS percentage
  // translation, so its loop speed remains consistent even after text changes.
  function initTicker() {
    tickerCleanup?.();
    const ticker = document.querySelector('.halo-ticker');
    const track = ticker?.querySelector('.halo-ticker__track');
    const firstCopy = track?.querySelector('.halo-ticker__copy');
    if (!ticker || !track || !firstCopy || reducedMotion) return;

    // Populate enough copies to cover wide displays before the first one loops
    // off-screen. The source copy stays readable; extras are presentation-only.
    while (track.scrollWidth < window.innerWidth * 2.5) {
      const clone = firstCopy.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.append(clone);
    }

    let frame = null;
    let previousTime = 0;
    let offset = 0;
    // The track is explicitly RTL so the first copy starts from the right,
    // while the animation always travels right-to-left.
    const direction = -1;
    const render = (time) => {
      const step = previousTime ? Math.min(time - previousTime, 48) : 16;
      previousTime = time;
      const loopWidth = Math.max(firstCopy.getBoundingClientRect().width, 1);
      offset += direction * step * .045;
      if (Math.abs(offset) >= loopWidth) offset -= direction * loopWidth;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      frame = requestAnimationFrame(render);
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        previousTime = 0;
        return;
      }
      if (!frame) frame = requestAnimationFrame(render);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    frame = requestAnimationFrame(render);
    tickerCleanup = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (frame) cancelAnimationFrame(frame);
      frame = null;
    };
  }

  function decorateCaseStudies() {
    document.querySelectorAll('#work .work-preview').forEach((preview) => preview.classList.add('halo-case-media'));
  }

  // A lightweight decorative composition gives the opening section a live,
  // scroll-reactive focal point. It uses one requestAnimationFrame per scroll
  // frame and CSS transforms only, keeping it smooth on normal hardware.
  function initKineticArtwork() {
    decorateCaseStudies();
    if (reducedMotion || updateKineticArtwork) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;
    let artwork = hero.querySelector('.halo-kinetic-artwork');
    if (!artwork) {
      artwork = document.createElement('div');
      artwork.className = 'halo-kinetic-artwork';
      artwork.setAttribute('aria-hidden', 'true');
      artwork.innerHTML = '<i></i><i></i><i></i><i></i>';
      hero.append(artwork);
    }

    let queued = false;
    const update = () => {
      queued = false;
      const bounds = hero.getBoundingClientRect();
      const distance = Math.max(hero.offsetHeight, 1);
      const progress = Math.min(1, Math.max(0, -bounds.top / distance));
      artwork.style.setProperty('--halo-artwork-y', `${progress * 124}px`);
      artwork.style.setProperty('--halo-artwork-turn', `${progress * 38}deg`);
      artwork.style.setProperty('--halo-artwork-scale', String(1 - progress * .12));
    };
    const queueUpdate = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    updateKineticArtwork = queueUpdate;
    update();
  }

  // Original prism composition for Services: CSS handles calm orbital drift,
  // while scroll position gives the whole object a deliberate response.
  function initServicesArtwork() {
    if (reducedMotion || updateServicesArtwork) return;
    const section = document.getElementById('services');
    if (!section) return;
    let artwork = section.querySelector('.halo-services-artwork');
    if (!artwork) {
      artwork = document.createElement('div');
      artwork.className = 'halo-services-artwork';
      artwork.setAttribute('aria-hidden', 'true');
      artwork.innerHTML = '<span></span><span></span><span></span><span></span><span></span><b>✳</b>';
      section.append(artwork);
    }
    let queued = false;
    const update = () => {
      queued = false;
      const rect = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / Math.max(window.innerHeight + rect.height, 1)));
      artwork.style.setProperty('--services-orbit-turn', `${-30 + progress * 92}deg`);
      artwork.style.setProperty('--services-orbit-y', `${(progress - .5) * -90}px`);
      artwork.style.setProperty('--services-orbit-scale', String(.88 + progress * .18));
    };
    const queueUpdate = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    updateServicesArtwork = queueUpdate;
    update();
  }

  function init() {
    organisePage();
    prepareHero();
    initPointerEffects();
    initServicesScroll();
    initScrollChoreography();
    initCaseStudyShowcase();
    initTicker();
    initKineticArtwork();
    initServicesArtwork();
  }

  function refresh() {
    prepareHero();
    servicesController?.measure();
    initScrollChoreography();
    initCaseStudyShowcase();
    initTicker();
    updateServicesArtwork?.();
    decorateCaseStudies();
    updateKineticArtwork?.();
  }

  window.EsnaaHalo = { init, refresh, resetHero, resetServices: () => servicesController?.reset() };
})();
