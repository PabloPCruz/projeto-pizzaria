---
description: "Use when troubleshooting Vercel deploy/build failures for this Angular app, including npm scripts, Angular output path, Node/runtime mismatch, and missing Vercel config."
name: "Vercel Deploy Troubleshooting"
applyTo:
  - "package.json"
  - "angular.json"
  - "vercel.json"
  - ".vercel/**"
---
# Vercel Deploy Troubleshooting

Use this checklist before changing code:

1. Reproduce build locally with npm ci and npm run build.
2. Read logs top-to-bottom and identify the first hard error. Do not treat npm deprecation warnings as the root cause by default.
3. Validate package scripts expected by CI:
   - Required for build: build
   - Optional for runtime previews: start or dev (this repo uses start:local for local only)
4. Validate Angular build output in angular.json and map Vercel output directory to dist/projeto-pizzaria.
5. Confirm Node version compatibility between local and Vercel. If drift exists, pin with package.json engines or .nvmrc.
6. If adding vercel.json, keep it minimal and only for required overrides.

Change policy:
- Prefer configuration fixes over refactors.
- Keep edits minimal and directly tied to the build error.
- After edits, run npm run build again and report exact outcome.

Reference docs:
- README.md
- QUICK_START.md
- documents/INDICE_DOCUMENTACAO.md
