# Ngọc Thạch — A Little Universe ✳

An art-directed, light-first, interactive personal portfolio for Nguyễn Ngọc Thạch. Built as a **zero-build, zero-framework, static website** that runs directly on GitHub Pages.

## A living art exhibition, not a developer dashboard

- A genuine **WebGL 3D kinetic sculpture** with custom vertex + fragment shaders, two sculptural rings and orbiting satellites. Drag it, tap it, or let it float. A CSS 3D fallback appears when WebGL is unavailable.
- Three daylight colour moods: apricot, lavender and mint; zero dark-mode palette.
- Four chapters: the person, selected worlds, convictions and collaboration.
- Interactive project catalogue with keyboard-operable native dialog.
- Responsive mobile navigation, scroll progress, subtle reveal and parallax-like movement.
- Semantic landmarks, reduced-motion support, focus indicators, no analytics, no tracking, no external JavaScript dependencies.

## Run

Open `index.html` in a browser (WebGL may require a static server on some browsers), or run locally:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`. The only optional network dependency is Google Fonts; fallback system fonts will work offline.

## Publish on GitHub Pages

**Repository:** `thachdeptrai/authme`  
**Desired URL:** `https://thachdeptrai.github.io/authme/`

**One-time GitHub Pages activation is required for a new repository:**

1. Open [Repository Settings → Pages](https://github.com/thachdeptrai/authme/settings/pages).
2. Under **Build and deployment**, set **Source = GitHub Actions** (not “Deploy from a branch”).
3. Open [Actions → Test & publish A Little Universe](https://github.com/thachdeptrai/authme/actions/workflows/pages.yml) and choose **Run workflow** if the initial run failed before Pages was activated.
4. Wait for a green workflow run, then open [https://thachdeptrai.github.io/authme/](https://thachdeptrai.github.io/authme/).

Every subsequent push to `main` will run zero-dependency checks and publish automatically. GitHub does not permit the default workflow token to activate Pages on behalf of a user; the initial Settings choice is necessary. All page paths are relative and work on the project subpath.

## Project layout

- `index.html`: accessible story/content structure
- `src/styles.css`: visual system, layouts, responsive art and motion
- `src/main.js`: interactions, accessible dialogs, menu and colour moods
- `src/scene.js`: entirely standalone WebGL scene and fallback
- `assets/*.svg`: favicon and social preview art
- `tests/ci_check.py`: CI HTML, asset and semantics verification (Python stdlib)\n- `tests/smoke.py`: optional Playwright smoke test for desktop and mobile browsers

## Editorial accuracy

This is a public-facing portfolio. Work context and general tool families are described, but no private repository code, internal warehouse data, credentials or proprietary business details are exposed. Some project capsules describe *areas of work*, not individually verified public releases.

© 2026 Nguyễn Ngọc Thạch.