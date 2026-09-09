# AviaFrame Backend

This package contains the backend API, operational endpoints, provider integrations, and business workflows for AviaFrame.

## What Lives Here

| Path | Purpose |
|---|---|
| [src/index.js](src/index.js) | Backend process entry point |
| [src/app.js](src/app.js) | Express app assembly and middleware registration |
| [src/routes/](src/routes/) | Public, admin, payments, webhooks, health, and support routes |
| [src/services/](src/services/) | DRCT integration, order lifecycle, email, PDF, and autocomplete services |
| [src/middleware/](src/middleware/) | Auth, idempotency, and tenant-hardening middleware |
| [tests/](tests/) | Automated tests, including security-oriented checks |
| [db/](db/) | Database-related notes and supporting material |
| [n8n_workflows/](n8n_workflows/) | Workflow definitions and related documentation |

## Key Review Files

- [src/routes/public.js](src/routes/public.js)
- [src/routes/orders.js](src/routes/orders.js)
- [src/routes/webhooks.js](src/routes/webhooks.js)
- [src/routes/health.js](src/routes/health.js)
- [src/services/orderService.js](src/services/orderService.js)
- [src/services/drctService.js](src/services/drctService.js)
- [src/lib/logger.js](src/lib/logger.js)

## Local Commands

```bash
npm --prefix backend test
npm --prefix backend lint
npm --prefix backend build
npm --prefix backend start
```

## Review Context

- Product and system context: [../ARCHITECTURE.md](../ARCHITECTURE.md)
- API contracts: [../docs/06_API_SPEC.md](../docs/06_API_SPEC.md)
- Security expectations: [../docs/08_SECURITY.md](../docs/08_SECURITY.md)
- Auditor-facing evidence pack: [../docs/audit/consolidator-aero/README.md](../docs/audit/consolidator-aero/README.md)
