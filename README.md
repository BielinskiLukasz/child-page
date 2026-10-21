# Spokojny Świat Artura

A calm, silent Polish-language web app for three-year-old Artur. A main menu with six large picture tiles opens a set of gentle, touch-driven activities, each with a Back button. **Intended for supervised use by a young child.**

## Activities
Akwarium Artura, Magiczny Ogród, Nocne Niebo, Dzień i Noc, Ogród Motyli, Malowanie Światłem. Each is a placeholder ("Już wkrótce!") until its own issue lands; replace the `mount` function of the entry in `js/activities.js`.

## Run locally
Plain HTML/CSS/JS, no build step:

```
python3 -m http.server 8000
```
then open http://localhost:8000/. Navigation uses URL hashes and relative paths, so it works from any subpath.

## Deployment
Pushing to `main` runs `.github/workflows/pages.yml`, which publishes to GitHub Pages. In the repo settings set Pages → Source to **GitHub Actions** once.

## Browser support
Mandatory manual tests: Chrome desktop, Chrome Android, Safari iPhone/iPad. Edge and Firefox should work. Zoom is intentionally disabled to avoid accidental pinch-zoom.

## Privacy
No backend, analytics, cookies, ads or tracking; no storage, no third-party requests, no data collected or transmitted. No audio.

## License
See `LICENSE`.
