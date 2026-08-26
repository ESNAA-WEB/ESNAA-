# ESNAA Security Baseline

This project is a static frontend. Client-side hardening reduces attack surface, but cannot make a static site or third-party form endpoint completely unhackable.

## Implemented in Task 4

- Content Security Policy meta policy for the current static architecture.
- `base-uri 'none'`, `object-src 'none'`, and `frame-ancestors 'none'`.
- `script-src 'self'`; the early theme/language bootstrap was moved out of inline JavaScript.
- Restricted `connect-src` and `form-action` to the Web3Forms endpoint.
- Portfolio preview iframes use the `sandbox` attribute.
- Dynamically created hover-preview iframe is sandboxed as well.
- Contact form has a Web3Forms `botcheck` honeypot plus reasonable client-side length limits.
- External links opened in new tabs use `rel="noopener"`.

## Hosting layer

When the final domain/hosting is selected, prefer sending these HTTP headers from the host/CDN rather than relying only on the HTML meta CSP:

- `Content-Security-Policy` — use the same policy as the page, then test with `Content-Security-Policy-Report-Only` first if the host supports it.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` only after HTTPS is confirmed for the domain and all subdomains.

## Web3Forms

The Web3Forms access key is intentionally public and is not a secret. Web3Forms documents the access key as public and recommends browser-side submission. For stronger anti-abuse protection, enable domain restriction and/or a supported CAPTCHA on the Web3Forms side when available.

## Remaining risk

The site still uses trusted local content with a few `innerHTML` sinks. These are not currently fed by visitor-controlled input. If content later comes from a CMS, database, API, or admin panel, do not pass that content directly into `innerHTML`; use `textContent` or sanitize HTML with a maintained sanitizer such as DOMPurify.
