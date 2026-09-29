# Windows Build & Run — Forge Responder Trade-Show Demo

## Fastest method

1. Extract the ZIP into a short local path, for example:
   `C:\ForgeResponder`
2. Install **Node.js 22 LTS**.
3. If you will demo GIS, copy `.env.example` to `.env.local` and set:
   `MAPBOX_ACCESS_TOKEN=...`
4. Double-click:
   `BUILD_FORGE_RESPONDER.bat`
5. When the build finishes successfully, double-click:
   `START_FORGE_RESPONDER.bat`
6. Open:
   `http://localhost:3000/en/demo-readiness`
7. Then open:
   `http://localhost:3000/en/guided-demo`

## What the build script does

The build script automatically:
- activates pinned pnpm 10.15.1
- performs `pnpm install --frozen-lockfile`
- runs all Forge regression validators
- runs TypeScript `tsc --noEmit`
- runs the real Next.js production build
- stops immediately on the first failure

Do not use the booth package until all stages pass.

## If it fails

Copy the complete PowerShell error output into ChatGPT. The stage heading identifies whether the failure came from:
- dependencies
- Forge validators
- TypeScript
- Next.js production build

That output is the source of truth for the next code correction.


## If the window flashes and closes

This patched package includes launchers that deliberately remain open.

Use these files in this order:

1. `CHECK_FORGE_SETUP.bat`
2. `BUILD_FORGE_RESPONDER.bat`
3. `START_FORGE_RESPONDER.bat`

`BUILD_FORGE_RESPONDER.bat` now always pauses before closing and writes all PowerShell output to `forge-build.log`.

If a build fails, copy the contents of `forge-build.log` into ChatGPT.


## v34b: Corepack permission fix

The launcher no longer runs `corepack enable`.

On standard Windows installs, `corepack enable` attempts to create package-manager shims under `C:\Program Files\nodejs`, which can require Administrator privileges and produce `EPERM: operation not permitted`.

The v34b launcher instead invokes pnpm directly as:

`corepack pnpm ...`

This keeps the build in the current user's context and does not require writing pnpm/yarn shims into Program Files.
