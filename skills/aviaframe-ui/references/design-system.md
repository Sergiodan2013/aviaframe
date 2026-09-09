# AviaFrame Design-System Reference

## Ownership

| Need | Source of truth | Consumers |
| --- | --- | --- |
| Brand, color, spacing, radius, shadow, font tokens | `packages/tokens` | Portal, widget, agency site |
| Reusable React primitives | `packages/ui` | `portal/client` |
| Widget aliases and fallback values | `packages/tokens/src/widget-tokens.js` | `widget` |
| Product-specific layout and copy | Product application | Its own surface |

## Token rules

- Tokens are semantic. Use `--af-danger`, not a literal red, for validation and destructive states.
- `--af-primary` must remain safe for agency branding. Contrast for white button text is the agency's responsibility; use a secondary treatment if it is not legible.
- New token names use the `--af-*` prefix. Add each token to `tokens.css` and, if the widget needs it, create a fallback alias in `widget-tokens.js`.
- Avoid raw visual values in reusable components except neutral transparent/white mixing needed to derive a token treatment.

## Workflow priorities

1. Search: inputs must be clear, validation local, and submission state unmistakable.
2. Offer selection: price, route, baggage, and constraints must be scannable before the action.
3. Passenger and payment: preserve entered data, explain errors next to their fields, and make total/next step visible.
4. Admin and onboarding: distinguish configuration state, action required, and healthy state using both text and tone.

## Adoption order

1. Use tokenized `Surface` and `Button` for new or touched portal screens.
2. Replace repeated field/status patterns in `SearchForm`, `PassengerForm`, and admin onboarding settings.
3. Convert widget styles by semantic area, retaining existing selectors and white-label customization.
4. Only then consider a broader component-library import if it removes real duplication.
