# AviaFrame

AviaFrame is a multi-tenant flight search and booking platform for travel agencies and distribution partners. The repository contains the customer-facing widget, internal portal, backend APIs, audit materials, and supporting product documentation used to operate and review the system.

## Review Paths

If you are reviewing the repository for a specific purpose, start here:

| Reviewer | Recommended entry point |
|---|---|
| Audit / due diligence | [docs/audit/consolidator-aero/README.md](docs/audit/consolidator-aero/README.md) |
| Business / stakeholder overview | [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/01_BRD.md](docs/01_BRD.md) |
| Technical implementation review | [docs/README.md](docs/README.md) |
| API / contract review | [docs/06_API_SPEC.md](docs/06_API_SPEC.md) and [docs/api/aviaframe-openapi.yaml](docs/api/aviaframe-openapi.yaml) |
| Security / compliance review | [docs/08_SECURITY.md](docs/08_SECURITY.md) and [docs/audit/consolidator-aero/03_Security_Controls.md](docs/audit/consolidator-aero/03_Security_Controls.md) |

## Repository Map

| Path | Purpose |
|---|---|
| [backend/](backend/) | Backend API, integrations, operational routes, and business workflows |
| [widget/](widget/) | Embeddable customer-facing booking widget |
| [portal/](portal/) | Portal services and client application for internal and agency use |
| [docs/](docs/) | Product, architecture, API, security, and audit documentation |
| [aviaframe-site/](aviaframe-site/) | Public website and hosted widget bundle assets |
| [infra/](infra/) | Infrastructure-related files and deployment support |
| [partners/](partners/) | Partner-facing materials and generated assets |

## Key Documents

| File | What it answers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | What AviaFrame is and how the main system pieces fit together |
| [docs/README.md](docs/README.md) | Main documentation index across product, technical, and audit materials |
| [docs/01_BRD.md](docs/01_BRD.md) | Target market, business model, and product goals |
| [docs/02_PRD.md](docs/02_PRD.md) | User journeys and product behavior |
| [docs/06_API_SPEC.md](docs/06_API_SPEC.md) | Public and internal API contracts |
| [docs/08_SECURITY.md](docs/08_SECURITY.md) | Security model, tenant isolation expectations, and PII handling |
| [docs/audit/consolidator-aero/README.md](docs/audit/consolidator-aero/README.md) | Auditor-facing evidence pack and readiness tracking |

## Package Entry Points

| Area | Main files |
|---|---|
| Backend runtime | [backend/src/index.js](backend/src/index.js), [backend/src/app.js](backend/src/app.js), [backend/src/routes/public.js](backend/src/routes/public.js) |
| Widget runtime | [widget/src/widget.js](widget/src/widget.js), [widget/src/index.js](widget/src/index.js) |
| Portal runtime | [portal/src/index.js](portal/src/index.js), [portal/client/src/App.jsx](portal/client/src/App.jsx) |

## Audit Review Notes

- The auditor-facing index is maintained in [docs/audit/consolidator-aero/README.md](docs/audit/consolidator-aero/README.md).
- Current readiness, open gaps, and evidence status are tracked in [docs/audit/consolidator-aero/artifacts/current-audit-readiness.md](docs/audit/consolidator-aero/artifacts/current-audit-readiness.md).
- Root-level task notes and historical markdown files are retained for delivery continuity. They are not the primary review path for an external audit.

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Commands

```bash
npm ci
npm run lint
npm test
npm run build
npm start
```

Root scripts are defined in [package.json](package.json) and cover the workspace packages listed there.

## Working Principles

- Treat `docs/` as the source of truth for architecture, product intent, and audit framing.
- Keep tenant boundaries, secrets handling, and PII masking aligned with [docs/08_SECURITY.md](docs/08_SECURITY.md).
- Prefer updating reviewer-facing indexes instead of scattering context across new top-level notes.

## Related Files

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [QUICKSTART.md](QUICKSTART.md)
- [LICENSE](LICENSE)
