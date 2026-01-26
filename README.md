````markdown
# aviaframe

Monorepo for the Aviaframe product.

Top-level structure:
- docs/ — product documentation, architecture, runbooks
- backend/ — backend services and APIs (Node)
- widget/ — embeddable frontend widget (Node/JS)
- portal/ — portal / web UI for users (Node/JS)
- infra/ — infrastructure-as-code (Terraform, CloudFormation, etc.)

Quick start (developer)
1. Create the repo and push the scaffold (see gh CLI snippet in CONTRIBUTING.md).
2. Install dependencies:
   - Node 18+
   - npm (v7+ for workspaces)
3. From the repository root:
   - npm ci
   - npm run lint
   - npm test
   - npm run build
   - npm start (starts docker-compose that runs backend & portal)

Repository scripts (root)
- npm run lint — runs eslint for the repository
- npm test — runs jest for all packages
- npm run build — runs build for backend, widget and portal (workspaces)
- npm start — docker-compose up --build