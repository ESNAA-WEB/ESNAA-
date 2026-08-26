# ESNAA Production Deployment Checklist

This package is prepared for deployment as a lightweight static Vanilla HTML/CSS/JS site.

## Before publishing

- [ ] Replace the placeholder WhatsApp URL in `index.html` with the real international WhatsApp number.
- [ ] Confirm the production email address.
- [ ] Choose the final domain.
- [ ] Enable HTTPS at the hosting/CDN layer.
- [ ] Configure DNS for the chosen host.
- [ ] Configure the HTTP security headers from `_headers` if the host supports it (Netlify/Cloudflare Pages-style `_headers`).
- [ ] If using a host that does not support `_headers`, configure the equivalent headers in that host's dashboard/server/CDN.
- [ ] Confirm the Web3Forms domain/form configuration.
- [ ] Test the contact form with a real submission.
- [ ] Test Arabic and English on desktop and mobile.
- [ ] Test dark/light mode.
- [ ] Test navigation, FAQ, portfolio previews, and logo animation.
- [ ] Open DevTools Console and Network and confirm there are no runtime errors or failed required assets.
- [ ] Test the final HTTPS production URL, not only the local `file://` version.

## GitHub Pages

The site does not require a build step. Upload the contents of this folder to the repository root and publish the branch/folder containing `index.html`.

`.nojekyll` is included so GitHub Pages does not apply Jekyll processing to the static files.

GitHub Pages does not provide arbitrary response headers in the same way as a server/CDN. If the security headers in `_headers` are required, use a hosting/CDN that supports them or put the site behind a suitable edge/CDN configuration.

## Domain

Do not create a `CNAME` file until the final domain is selected. This prevents accidentally binding the project to the wrong hostname.

## Backend

No backend is required for the current public static site. Do not add a server/database solely for page rendering. Add backend infrastructure later only for concrete requirements such as lead storage, admin editing, authentication, analytics, or protected secrets.
