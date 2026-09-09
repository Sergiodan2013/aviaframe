# AviaFrame Design-System Adoption

**Status:** foundation implemented  
**Scope:** portal, embeddable widget, agency-facing surfaces

## What now exists

| Layer | Location | Purpose |
| --- | --- | --- |
| Tokens | `packages/tokens` | One semantic vocabulary for brand, states, spacing, radius, shadow, and typography. |
| React primitives | `packages/ui` | Small reusable `Surface`, `Button`, `Field`, and `StatusBadge` building blocks. |
| Agent guidance | `skills/aviaframe-ui` | Persistent rules that apply the system consistently across later UI tasks. |
| First adoption | `SearchForm` and widget CSS | Proof that portal and widget consume the same contract without a rewrite. |

## Integration contract

The design system is deliberately layered:

```text
Agency branding / product defaults
              |
      @aviaframe/tokens
         /            \
portal React UI     vanilla-JS widget
  @aviaframe/ui       widget token aliases
```

`--af-*` variables are public semantic values. An agency can override, for example, `--af-primary` and `--af-radius` on its host page; the widget resolves them through safe fallback aliases. React uses the same defaults through `portal/client/src/index.css`.

## Adoption order

1. Use tokens and existing primitives whenever a portal screen is changed.
2. Replace repeated inputs, alerts, and status chips in `PassengerForm` and admin onboarding/settings with `Field` and `StatusBadge`.
3. Convert widget visual areas one semantic block at a time: search, results, passenger capture, and confirmation. Keep selectors and public white-label variables compatible.
4. Add a primitive only after the same interaction or accessibility behavior is needed in at least two places.

## Guardrails

- Do not import React packages into `widget`.
- Do not hardcode new color values for semantic states; extend `packages/tokens` first.
- Keep fare, passenger, payment, validation, and confirmation states readable without relying on color alone.
- Every changed widget flow must be checked with a host-page override of `--af-primary` and in both LTR and RTL.

## First follow-up slice

The next low-risk implementation slice is to migrate the validation and contact/passenger fields in `portal/client/src/components/PassengerForm.jsx`, then make the corresponding widget passenger form consume the same primary, surface, border, and danger aliases. This improves the booking path where consistency matters most without coupling the two rendering stacks.
