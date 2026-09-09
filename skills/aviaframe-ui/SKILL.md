---
name: aviaframe-ui
description: Build or review AviaFrame portal, widget, and agency-site UI using the shared design tokens and booking-flow conventions. Use for user-facing UI changes, not backend-only work.
---

# AviaFrame UI

Use the shared UI contract before introducing one-off colors, radii, or interaction patterns.

## Scope

- `portal/client` is the React/Tailwind product surface. Prefer components from `@aviaframe/ui` when they fit; extend the package when a primitive will be reused.
- `widget` is an embeddable vanilla-JS product. Do not import React components into it. Use the shared `@aviaframe/tokens` CSS variables and keep host-page isolation intact.
- `aviaframe-site` is an agency-facing hosted surface. Follow the same semantic token names even when its implementation remains plain HTML/CSS.

## UI decisions

- Use semantic tokens from `packages/tokens/src/tokens.css`: `--af-primary`, `--af-surface`, `--af-text`, `--af-border`, `--af-success`, `--af-warning`, and `--af-danger`.
- Preserve the public white-label variables already documented for the widget. New defaults must remain overridable by an agency without rebuilding the widget.
- Prefer a small number of calm, clear surfaces. Booking and payment screens should prioritize fare, passenger data, validation, price, and next action over decorative visual density.
- Treat loading, empty, error, and confirmation states as first-class UI. Never communicate a booking-critical state by color alone.
- Keep keyboard focus visible, provide labels for controls, and preserve `dir="rtl"` / Arabic behavior in the widget.

## Component policy

- Add a component to `packages/ui` only when it has a clear, reusable behavior or accessibility contract. Keep product-specific layout in the product surface.
- Use `Button`, `Surface`, `Field`, and `StatusBadge` as the initial primitives. Do not add a component solely to remove a few Tailwind classes.
- Prefer a prop such as `tone="success"` over hardcoded status colors.
- Keep transitions short (about 160-200ms), purposeful, and disabled when they obscure critical status changes.

## Before finishing

- Run the affected frontend build.
- Check desktop and narrow viewport behavior for changed flows.
- For widget changes, verify a host override such as `--af-primary` still changes the rendered widget.
- Read [the design-system reference](references/design-system.md) when adding tokens, primitives, or a new workflow state.
