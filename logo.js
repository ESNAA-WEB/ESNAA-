/* ESNAA logo state machine.
 *
 * intro         -> big pyramid + wordmark + tagline play their construction
 *                  animation, centered on screen, above a full-screen backdrop.
 * transitioning -> the SAME mark element is moved into the navbar's logo slot
 *                  and, using a FLIP transform, animates from its big/centered
 *                  position down to its small/in-place navbar position. The
 *                  wordmark + tagline simply fade out (they never travel).
 * navbar        -> the mark sits permanently in the nav, small. Hovering it
 *                  (plain CSS :hover, see logo.css) reveals the wordmark.
 *
 * RTL is never hard-coded: direction is read from <html dir> at the moment
 * it's needed, and the final resting position comes from the real navbar
 * layout (which already mirrors correctly via the site's existing RTL nav).
 */
(function () {
  var INTRO_MS = 4600;       // time for the construction animation to read as "finished"
  var TRANSITION_MS = 900;   // shrink + travel duration (spec: 700-1000ms)

  function initLogo() {
    var anchor = document.getElementById('esnaaLogo');
    var slot = document.getElementById('esnaaMarkSlot');
    var mark = document.getElementById('esnaaMark');
    var stage = document.getElementById('esnaaLogoStage');
    var backdrop = document.getElementById('esnaaBackdrop');
    var introWord = document.getElementById('esnaaIntroWord');
    var introTagline = document.getElementById('esnaaIntroTagline');

    if (!anchor || !slot || !mark || !stage) return;

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function settleIntoNavbarInstantly() {
      slot.appendChild(mark);
      anchor.dataset.state = 'navbar';
      if (backdrop) {
        backdrop.style.transition = 'none';
        backdrop.style.opacity = '0';
        backdrop.setAttribute('hidden', '');
      }
      stage.setAttribute('hidden', '');
    }

    // Reduced motion: skip the whole cinematic sequence, land directly on
    // the final, compact navbar logo.
    if (reduceMotion) {
      settleIntoNavbarInstantly();
      return;
    }

    root.classList.add('esnaa-intro-lock');

    requestAnimationFrame(function () {
      if (introWord) introWord.classList.add('is-visible');
      if (introTagline) introTagline.classList.add('is-visible');
    });

    function moveMarkIntoNavbar() {
      // 1) Capture where the mark visually is right now (big, centered).
      var fromRect = mark.getBoundingClientRect();

      // 2) Reparent into its real, permanent home. This instantly (same
      //    frame, before paint) makes it small and in-flow inside the nav.
      slot.appendChild(mark);
      var toRect = mark.getBoundingClientRect();

      // 3) Bridge the visual gap with a transform so nothing jumps.
      var scale = fromRect.width / toRect.width;
      var dx = fromRect.left - toRect.left;
      var dy = fromRect.top - toRect.top;

      mark.style.transition = 'none';
      mark.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';
      void mark.offsetHeight; // force layout so the jump-free start is applied

      // 4) Next frame, animate that offset away — the mark visibly shrinks
      //    and travels from the intro position into the navbar.
      requestAnimationFrame(function () {
        mark.style.transition = 'transform ' + TRANSITION_MS + 'ms cubic-bezier(.65,0,.35,1)';
        mark.style.transform = 'translate(0, 0) scale(1)';
      });

      window.setTimeout(function () {
        mark.style.transition = '';
        mark.style.transform = '';
        anchor.dataset.state = 'navbar';
        stage.setAttribute('hidden', '');
      }, TRANSITION_MS + 80);
    }

    function startTransition() {
      anchor.dataset.state = 'transitioning';
      root.classList.remove('esnaa-intro-lock');

      if (introWord) introWord.classList.remove('is-visible');
      if (introTagline) introTagline.classList.remove('is-visible');

      if (backdrop) {
        backdrop.style.pointerEvents = 'none';
        backdrop.style.opacity = '0';
        backdrop.addEventListener('transitionend', function onEnd() {
          backdrop.removeEventListener('transitionend', onEnd);
          backdrop.setAttribute('hidden', '');
        }, { once: true });
      }

      moveMarkIntoNavbar();
    }

    window.setTimeout(startTransition, INTRO_MS);
  }

  window.EsnaaLogo = { initLogo: initLogo };
})();
