# Access Review Log

Use this table for the next formal review of staging and production access.

Repository-based baseline prepared on `2026-06-02`.
This log intentionally separates `confirmed from repo` vs `requires console/manual confirmation`.

| Review date | Environment | System | User / service | Role / permission | Owner | Action | Notes |
|---|---|---|---|---|---|---|---|
| 2026-06-02 | production | Supabase | backend service role | DB/service-role access | Ops | verify | Confirm exact service account and key storage path outside repo |
| 2026-06-02 | production | Supabase | portal/widget clients | anon/public access | Ops | verify | Public/anon key use is visible in repo; confirm live project and policies |
| 2026-06-02 | staging | Supabase | staging backend / staging operators | DB/service-role access | Ops | verify | Staging setup is documented; console-level access still needs review |
| 2026-06-02 | production | Railway backend hosting | engineering / deploy operator | deploy and env-secret access | Ops | review | Repo handoff notes indicate Railway CLI deployment is in use |
| 2026-06-02 | production | Netlify site hosting | web/admin operator | site deploy, redirects, domain config | Ops | review | Public site and legal pages are deployed via Netlify |
| 2026-06-02 | production | DRCT provider console | integration owner | provider credentials / account admin | Ops | review | Confirm named owners, MFA, and fallback contacts |
| 2026-06-02 | production | Tamara console | payments owner | provider credentials / webhook config | Ops | review | Confirm who can rotate tokens and edit webhook settings |
| 2026-06-02 | production | Moyasar console | payments owner | PSP and hosted payment configuration | Ops | review | Privacy/legal pages reference Moyasar as live PSP |
| 2026-06-02 | production | email/SMTP provider | ops or support owner | SMTP/API credentials | Ops | review | Repo shows SMTP/email secrets in use but not provider console owner |
| 2026-06-02 | production | DNS / domain management | ops owner | domain / CNAME / subdomain administration | Ops | review | GoDaddy automation is referenced in provisioning code |

## Next Manual Confirmation

- Export the actual user and role lists from Supabase, Railway, Netlify, DRCT, Tamara, Moyasar, and DNS provider consoles.
- Mark each entry as `keep / revoke / reduce privileges`.
- Record whether MFA is enabled for each production console.
- Add offboarding status for anyone who no longer needs access.
