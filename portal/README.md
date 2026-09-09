# AviaFrame Portal

This package contains the portal-facing server layer and the client application used for internal operations, agency workflows, and administrative views.

## What Lives Here

| Path | Purpose |
|---|---|
| [src/index.js](src/index.js) | Portal server entry point |
| [client/src/App.jsx](client/src/App.jsx) | Main client application shell |
| [client/src/main.jsx](client/src/main.jsx) | Client bootstrap |
| [client/src/index.css](client/src/index.css) | Client styling entry point |
| [client/public/](client/public/) | Static assets and embeddable support pages |
| [client/README.md](client/README.md) | Client-specific setup and notes |

## Local Commands

```bash
npm --prefix portal start
npm --prefix portal build
```

For the React client:

```bash
npm --prefix portal/client install
npm --prefix portal/client run dev
npm --prefix portal/client run build
```

## Review Context

- Platform overview: [../ARCHITECTURE.md](../ARCHITECTURE.md)
- Product requirements: [../docs/02_PRD.md](../docs/02_PRD.md)
- Audit evidence pack: [../docs/audit/consolidator-aero/README.md](../docs/audit/consolidator-aero/README.md)
