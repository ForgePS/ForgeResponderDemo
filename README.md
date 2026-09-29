# Forge Responder — ThemeSelection Integrated Demo

This repository is a standalone Forge Responder trade-show build based on the licensed ThemeSelection Vuexy MUI/Next.js full-version template.

## v25 integration checkpoint
- Actual Vuexy MUI / Next.js 16 template is now the base.
- Forge Responder branding replaces Vuexy branding in the primary shell.
- Trade-show build bypasses authentication intentionally; this is not the production auth architecture.
- Forge navigation replaces the template sample-app navigation.
- Full sanitized Forge demo seed bundle is included under `src/data/forge-responder`.
- Native ThemeSelection/MUI pages implemented for Dashboard, Hydrants, Personnel, and Apparatus.
- Remaining Forge module routes have safe integration placeholders so navigation has no dead links.
- No live NERIS/NEMSIS submission is enabled.
- No production credentials or source department identifiers should be present.

## Next integration wave
Port v24 workflows into native MUI components: Prevention/Occupancies/Preplans/Inspections, Incidents/NERIS/ePCR, Training, Inventory, Investigations, Maps, Reports, Activity/Audit, and Settings.


## Forge Responder Theme Integration v26

Native ThemeSelection/Vuexy Prevention integration:
- Community Risk & Prevention hub
- Native MUI Occupancy registry
- Occupancy detail routes with prevention actions
- Native MUI Preplan registry and detail route
- Multi-step browser-local Preplan Builder
- Native MUI Inspection Programs page
- Template-driven multi-step Inspection Wizard
- Source-backed vs demo-navigation boundaries retained
- Remaining legacy-style `HL-###` personnel IDs sanitized to neutral `FR-###`
- Identity validator expanded to block legacy-style personnel IDs


## Forge Responder Theme Integration v27

Native ThemeSelection/Vuexy operational reporting workflows:
- Incidents dashboard and lifecycle presentation
- Multi-step Incident Wizard
- NERIS validation center
- Explicit no-live-submission NERIS boundary
- EMS Operations dashboard
- ePCR landing page
- Multi-step ePCR Wizard
- Explicit no-source-ePCR-history and no-NEMSIS-transmission boundaries


## Forge Responder Theme Integration v28 — Schema-Driven NERIS

NERIS V1 Core and Secondary workbook archives now drive the NERIS trade-show UI.

Parsed schema:
- 39 modules
- 603 fields
- 126 value sets
- 1,175 coded options
- 148 conditional fields
- 53 computed fields
- 40 database-required fields
- 265 value-set-referenced fields

Added:
- searchable Core/Secondary schema catalog
- per-module field drill-down
- possible_if rule display
- computed_from visibility
- cardinality and requirement classification
- value-set reference counts
- value-set explorer
- live NERIS submission remains disabled


## Forge Responder Theme Integration v29

Native Vuexy/MUI workflow migration:
- Training dashboard
- Training assignment wizard
- Training completion workflow
- Source-backed credential readiness
- Inventory dashboard
- Inventory transaction wizard
- Investigation dashboard
- Investigation case-intake wizard
- Explicit no-source-history boundaries preserved for Training Events, Inventory, and Investigations


## Build Verification Status

Production dependency installation was attempted in the execution environment. The npm registry could not be reached (`getaddrinfo EAI_AGAIN registry.npmjs.org`), so `pnpm` could not be fetched and a real Next.js production build could not run here.

A global TypeScript compiler audit was still performed. Most diagnostics are expected missing-package errors because `node_modules` is unavailable. One real Forge integration typing issue was identified and fixed (`StatCard` color on the Incidents page).


## Forge Responder Theme Integration v30

Native Vuexy/MUI migration:
- Reports and report builder
- Report export simulation
- Activity timeline
- Audit timeline
- Administration & Settings
- Module toggles
- Role/permission demonstration
- Tenant configuration
- Operational Map
- Layer controls and record drill-down


## Forge Responder Theme Integration v31 — Hydrant GIS & Operations

Added:
- Real Mapbox hydrant GIS layer using `react-map-gl/mapbox`
- Source-backed hydrant latitude/longitude plotting
- Status-colored markers and popup record drill-down
- Hydrant detail page
- Source-backed flow-test history
- Flow-test wizard with pressure/discharge calculation
- Projected available flow at 20 psi residual
- NFPA capacity class presentation
- Hydrant inspection workflow
- Damage / repair intake workflow
- Explicit MAPBOX_ACCESS_TOKEN configuration

Flow calculations in the demo use the NFPA 291 published discharge equation convention and capacity class thresholds. Official tests remain subject to the department, water authority, and AHJ procedures.


## Forge Responder Theme Integration v32 — Placeholder Elimination

Final Forge placeholder routes migrated:
- Unified Operational Search
- Shift Trades
- Shift Trade request / qualification / approval workflow
- Demo Control Center
- Presenter workflow launchpad
- Local session reset

The Forge-specific ThemeSelection route scan now reports no remaining `integration queue`, `coming soon`, or `under construction` placeholders.


## Forge Responder Theme Integration v33 — Trade-Show Hardening

Added:
- Booth Mode toolbar
- Full-screen controls
- One-click local demo reset
- Presenter launchpad integration
- Demo Readiness / preflight page
- Browser/network/storage/Mapbox checks
- Deterministic 10-step Guided Demo
- Larger touch targets in booth mode
- Tablet/mobile trade-show CSS
- Booth runbook
- Local start guide
- Forge route manifest


## Forge Responder Theme Integration v34 — Production Build Package

Build-focused cleanup:
- Removed irrelevant Vuexy sample dashboard/app/chart/form/table/front-page routes
- Removed sample API app/page routes
- Retained the shared Vuexy/MUI framework
- Pinned pnpm 10.15.1
- Added `validate:all`
- Added `build:verified`
- Added one-click Windows build and start launchers
- Added frozen-lockfile install gate
- Added production package validator
- Added Windows deployment instructions
- Added explicit build-gate status documentation

The current execution environment cannot reach the npm registry. The production package therefore includes deterministic build tooling for the booth machine, where the real TypeScript and Next.js build gates can run with normal registry access.


## v34c TypeScript Fix

Fixed MUI Alert typing failure:
- `Alert variant="tonal"` is invalid in MUI 7.
- Replaced with `variant="outlined"`.
- Added a regression validator that blocks any future `Alert variant="tonal"` usage.


## v34d Runtime Port Handling

Production start now:
- checks port 3000 first
- automatically tries 3001–3010 if a port is occupied
- prints the actual selected URL
- automatically opens the Guided Demo page after startup


## v34e Runtime Auth / Root Route Fix

Fixed production runtime issues:
- Removed `NextAuthProvider` / `SessionProvider` from the Forge booth provider tree.
- Added a root `/` redirect to `/en/guided-demo`.
- Production starter generates an ephemeral `NEXTAUTH_SECRET` each run as a dormant-endpoint safety net.
- Production starter sets `NEXTAUTH_URL` to the actual selected local port.
- `authOptions` consumes `NEXTAUTH_SECRET`.
- Updated root metadata to Forge Responder branding.

The trade-show build does not require login.


## v34f Prisma / Auth Runtime Removal

The standalone trade-show build no longer uses a database or live authentication runtime.

Removed from the booth runtime:
- Prisma client generation from `postinstall`
- Prisma schema/runtime usage
- NextAuth API route
- sample login/API route
- Prisma-backed auth adapter
- auth guards / guest-only sample login pages
- session-driven user dropdown

`postinstall` now only builds the Vuexy icon bundle. This prevents Windows/OneDrive Prisma query-engine DLL rename failures during dependency installation.


## v34g Shared Server Render Hardening

Fixed a shared dashboard failure mode:
- Vuexy settings cookies are now parsed defensively.
- URL-encoded cookie values are supported.
- Invalid/stale cookie JSON falls back to clean settings instead of crashing SSR.
- Forge settings cookie name is versioned to isolate this build from older localhost sessions.
- Added `/en/system-smoke` to test the shared dashboard layout independently of module data.

This is especially important during local development because browser cookies are shared across `localhost` ports.


## v34h Legacy Extraction Cleanup

The Windows build now removes obsolete files from older Forge Responder packages before validation. This prevents stale files from surviving when a new ZIP is extracted over an existing folder.

Examples automatically removed:
- `src/libs/auth.ts`
- old NextAuth routes/providers
- old auth guards/login screens
- `src/prisma`

A completely fresh folder is still preferred, but v34h is now resilient to in-place upgrades.


## v34i Stale Next.js Type Cleanup

Fixed TypeScript errors caused by stale `.next/types/validator.ts` references to routes removed from the current booth build.

The Windows build now deletes `.next` before:
- dependency validation
- TypeScript typecheck
- Next.js production build

This forces Next.js/TypeScript to regenerate route metadata from the current source tree instead of reusing route types from an older build.


## v34j React Server/Client Boundary Fix

Fixed production runtime digest `744549109`:

`Functions cannot be passed directly to Client Components`

Cause:
- Forge route pages are React Server Components by default.
- MUI controls are Client Components.
- Passing `component={Link}` sent the Next.js `Link` function through the Server -> Client serialization boundary.

Fix:
- Removed `component={Link}` / `component={NextLink}` from all Forge Server Components.
- MUI controls keep their normal `href` string, which is serializable and renders navigation without passing a function prop.
- Client Components may still use `component={Link}` safely.
- Added a regression validator for Forge server/client boundaries.


## v34k Persistent Demo Branding

Forge Responder now supports customer/department branding that stays with the local demo installation.

### Demo Branding
Open **Settings -> Demo Branding** to manage:
- Primary Agency Logo
- Secondary Logo / Patch

Supported files:
- PNG
- JPG/JPEG
- WEBP
- Maximum 4 MB per image

The Primary Agency Logo appears beside the Forge Responder wordmark in the sidebar. If no agency logo has been uploaded, the normal red `FR` mark is shown.

### Persistence
Uploaded branding is written at runtime to:

`demo-persistence/`

This directory is intentionally not part of the downloadable build ZIP and is never removed by the Forge cleanup scripts. Therefore, extracting a future Forge Responder build over the same installation folder will not overwrite the saved customer logos.

Branding survives:
- browser restarts
- production server restarts
- Windows reboots
- localhost port changes
- normal rebuilds
- in-place demo version upgrades

Run `BACKUP_DEMO_BRANDING.bat` to create a timestamped copy under `demo-branding-backups/`.
