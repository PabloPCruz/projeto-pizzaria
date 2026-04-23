# Project Guidelines

## Scope
These instructions apply to the whole repository. Prefer this file for project-wide behavior.

## Build And Test
Use these commands unless the task explicitly asks for something else:

- Install: npm ci
- Local dev: npm run start:local
- Build: npm run build
- Test: npm test

Always run a local build before proposing deploy changes.

## Architecture
This is an Angular NgModule-based app (not standalone components).

- Routing entry: src/app/app.routes.ts
- Feature UI: src/app/components/
- Business orchestration: src/app/facade/
- Business logic and integrations: src/app/services/
- Shared contracts: src/app/interfaces/
- Static assets: src/assets/ and public/

When changing UI behavior, keep business rules in services/facades and keep components thin.

## Conventions
- Prefer facades in components instead of direct service/mocks wiring.
- Do not duplicate formatting or cart math logic in components; reuse FormatService and CartCalculationService.
- Keep naming consistent with existing patterns:
  - Facades: *.facade.service.ts
  - Services: *.service.ts
  - Interfaces: *.interface.ts

## Deploy And CI Notes (Vercel-focused)
For deploy/build failures, follow this order:

1. Reproduce with npm ci and npm run build.
2. Separate warnings from blockers: npm deprecation warnings alone are usually not the failure root.
3. Confirm scripts in package.json match what CI expects (this repo has build and test; local run uses start:local).
4. Confirm Angular output path in angular.json (dist/projeto-pizzaria) when configuring hosting output directory.
5. If Vercel config is required, add a minimal vercel.json and avoid unrelated refactors.

When reporting a failure, include the first real error line and the stack/context around it.

## Project Docs (Link, Do Not Duplicate)
- README: README.md
- Quick start: QUICK_START.md
- Docs index: documents/INDICE_DOCUMENTACAO.md
- Facade usage guide: documents/GUIA_USO_FACADES.md
- Refactor summary: documents/README_REFATORACAO.md
