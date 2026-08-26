/**
 * Single place that defines where the ESNAA backend API lives.
 *
 * - Local development (site opened on localhost/127.0.0.1): talks to the
 *   backend directly on http://localhost:5000.
 * - Any other host (production): assumes the backend is reverse-proxied
 *   under the same domain at /api (recommended — avoids extra CORS/CSP
 *   configuration). If you deploy the API on a separate domain instead,
 *   change API_BASE_URL below AND update the Content-Security-Policy
 *   `connect-src` in index.html to include that domain.
 */
window.ESNAA_API_BASE_URL = (() => {
  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocalDev ? 'http://localhost:5000/api' : '/api';
})();
