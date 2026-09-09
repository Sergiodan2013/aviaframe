# Backup and Restore Runbook

Owner: Ops  
Backup owner: Engineering  
Status: draft for approval

## Goal

Prove that critical AviaFrame data can be restored within the agreed recovery assumptions.

## Scope

- Supabase database backup source
- document metadata
- storage/document references
- key runtime configuration inventory

## Steps

1. Identify latest valid backup and backup timestamp.
2. Select restore target: staging or isolated restore environment.
3. Restore a controlled subset or full snapshot as approved.
4. Validate:
   - tenant records visible
   - orders readable
   - document metadata present
   - critical auth/config tables intact
5. Record restore duration and issues.
6. Define any manual follow-up needed for full production recovery.

## Evidence Produced

- backup source
- restore date
- restore target
- validation checklist
- observed RTO / issues
