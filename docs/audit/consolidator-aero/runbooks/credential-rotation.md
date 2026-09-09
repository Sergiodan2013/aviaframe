# Credential Rotation Runbook

Owner: Ops  
Backup owner: Engineering  
Status: draft for approval

## Trigger

- scheduled rotation
- suspected secret exposure
- provider request from DRCT, email, payment, or hosting vendor

## Scope

- Supabase service-role secrets
- internal API token
- DRCT credentials
- payment provider tokens
- email/SMTP credentials

## Steps

1. Identify impacted secret and environment(s).
2. Confirm dependent services and fallback/rollback path.
3. Rotate in non-production first when possible.
4. Update secure secret store or runtime environment.
5. Redeploy only the required service after approval.
6. Validate health, auth, provider connectivity, and critical flows.
7. Record rotation date, owner, and validation result.

## Evidence Produced

- secret name and environment
- rotation reason
- validation checks run
- owner approval
- rollback note
