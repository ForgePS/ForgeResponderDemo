# Local Start

This package is based on the ThemeSelection Vuexy Next.js template.

## Required
- Node 22
- pnpm matching the packageManager field
- `MAPBOX_ACCESS_TOKEN` if live GIS is used

## Commands
```bash
pnpm install
pnpm typecheck
pnpm build
pnpm start
```

For development:
```bash
pnpm dev
```

The build has structural/integration validators under `scripts/`. Run the package validation scripts before booth deployment.


## One-command Windows build
Use `BUILD_FORGE_RESPONDER.bat`.

## One-command Windows production start
Use `START_FORGE_RESPONDER.bat`.
