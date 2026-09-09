# Deployment Safety Gate

Use this checklist before any audit-related deployment.

## Rule

No audit-hardening change goes to production until the impact on:

- customer booking flows
- agency admin workflows
- platform admin workflows
- payment callbacks and webhooks
- ticket issuance and document delivery

has been checked explicitly.

## Pre-Deploy Questions

1. Does the change touch authentication or authorization paths?
2. Does the change touch booking, payment, webhook, or ticketing code?
3. Does the change alter request/response shape for portal, widget, or provider callbacks?
4. Does the change alter environment variables, secrets, or provider configuration?
5. Does the change alter retry logic, async processing, or state transitions?

If any answer is `yes`, stop and do a separate checkpoint review before deploy.

## Minimum Evidence Before Deploy

- diff reviewed
- affected routes and user flows listed
- rollback path stated
- local tests/build run
- staging validation path defined
- business-impact statement written in one sentence

## Explicit No-Deploy Categories

These changes are safe to prepare now but should not be auto-deployed as part of audit prep:

- durable async queue migration
- auth auto-provisioning refactor
- provider callback flow redesign
- state model enforcement across production business flows

## Sample Approval Note

`Approved for staging only. No expected impact on customer booking, admin access, or payment callbacks. Change limited to observability/docs/tests. Rollback: revert commit and redeploy previous build.`
