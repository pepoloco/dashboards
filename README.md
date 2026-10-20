# Portfolio · Penyo Banchev

Personal portfolio site with a live sales-dashboards demo, hosted on GitHub Pages.

- Portfolio: https://pepoloco.github.io/dashboards/
- Dashboards demo: https://pepoloco.github.io/dashboards/demo/

## Repository layout

```
apps/
  portfolio/          Static portfolio page (index.html + media/), served at the site root
  dashboards-demo/    Next.js app, exported as static files and served at /demo/
assets/
  originals/          Source images before resizing (not deployed)
.github/workflows/
  pages.yml           CI: type-check + build on every push and PR; deploys main to GitHub Pages
```

## Workflow

1. Branch off `main` for a change.
2. Run the demo locally (`cd apps/dashboards-demo && npm install && npm run dev`) or open
   `apps/portfolio/index.html` in a browser.
3. Push and open a pull request. CI type-checks and builds the site.
4. Merge to `main`. The workflow publishes the portfolio and demo to GitHub Pages.

The demo's base path is set at build time from the repository name (`/<repo>/demo`).
If the site moves to a custom domain, change `NEXT_BASE_PATH` in `.github/workflows/pages.yml` to `/demo`.
