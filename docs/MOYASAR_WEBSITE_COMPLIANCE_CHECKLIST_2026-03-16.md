# Moyasar Website Compliance Checklist

Date: 2026-03-16 (last updated: 2026-03-16)
Entity: **Consolidator Aviatech Limited** (شركة توحيد أفياتيك المحدودة)
CR: 7040488483 · VAT: 312321814500003

---

## Moyasar Requirements — Coverage Status

| Requirement | Page | Status |
|---|---|---|
| Products or services | Terms §1 (two products: flight booking + SaaS SAR 300/mo) | ✅ Done |
| Description of products or services | Pricing page, Terms §1–2 | ✅ Done |
| Pricing | `/legal/pricing.html` — flight fee table + SAR 300/mo subscription card | ✅ Done |
| Return and exchange policy | `/legal/refund-and-cancellation-policy.html` | ✅ Done |
| Contact information | `/legal/contact-information.html` — all real data filled | ✅ Done |

---

## Legal Pages (all publicly accessible at `/legal/`)

| Page | URL | Status |
|---|---|---|
| Legal home | `/legal/index.html` | ✅ All placeholders replaced |
| **Pricing** | `/legal/pricing.html` | ✅ Two products, fee table, example with 3 payment methods |
| Terms and Conditions | `/legal/terms-and-conditions.html` | ✅ Aggregator model described in §1 |
| Refund & Cancellation | `/legal/refund-and-cancellation-policy.html` | ✅ Fare types table, 5–15 day timeline |
| Privacy Policy | `/legal/privacy-policy.html` | ✅ Moyasar as SAMA-licensed PSP named |
| Contact Information | `/legal/contact-information.html` | ✅ Real entity, CR, VAT, address, phone |

---

## Business Model (for Moyasar onboarding description)

**Model: Multi-merchant / Payment aggregator**

- Consolidator Aviatech Limited operates ONE Moyasar merchant account
- Two transaction types flow through this account:

| Transaction | Payer | Amount | Frequency |
|---|---|---|---|
| Flight ticket purchase | End customer (passenger) | Variable SAR (airline fare + agency markup + payment fee) | Per booking |
| Platform subscription | Travel agency | SAR 300/month | Monthly recurring |

- Travel agencies embed AviaFrame widget on their own branded domains (e.g. agency.aviaframe.com)
- End customers pay AviaFrame directly; agency service fees are remitted to agencies by monthly invoice
- AviaFrame revenue = SaaS subscription only (SAR 300/month per agency); does NOT take margin on ticket price

---

## Acquiring Fee Structure (for Moyasar disclosure)

| Payment Method | Fee Charged to Customer | Moyasar Rate | Notes |
|---|---|---|---|
| Bank Transfer / Cash | 0% | N/A | No payment processing |
| Mada | 1% | 1% | Break-even |
| Visa / Mastercard | 2.75% | 2.75% | Break-even |

Fee is disclosed at checkout when customer selects payment method. Price in search = fare + agency markup (no acquiring fee). Acquiring fee added transparently at payment step.

---

## Company Details (all verified, no placeholders remaining)

| Field | Value |
|---|---|
| Legal Name (EN) | Consolidator Aviatech Limited |
| Legal Name (AR) | شركة توحيد أفياتيك المحدودة |
| CR Number | 7040488483 |
| VAT Number | 312321814500003 |
| Address | 7529 Salahuddin Al Ayyubi Branch, Al Zahra District, Riyadh 12811, KSA |
| Phone / WhatsApp | +966 50 563 2561 |
| Support email | support@aviaframe.com |
| Billing email | billing@aviaframe.com |
| Complaints email | complaints@aviaframe.com |
| Privacy email | privacy@aviaframe.com |

---

## Pre-Submit Checklist

- [x] All `[placeholder]` values replaced in all 5 pages
- [x] Open each page in browser and confirm HTTP 200 (no 404) — verified 2026-03-16, all 7 URLs return 200
- [x] Confirm footer/menu has link to `/legal/` from main portal — Legal column in footer confirmed
- [ ] Confirm support/billing email inboxes are monitored
- [ ] Prepare short demo video or screenshots of the booking flow showing pricing display
- [ ] Send legal page URLs + demo to Moyasar onboarding team

---

## Notes

- Arabic versions of legal pages are recommended for KSA audience but not mandatory for PSP onboarding
- Next step after Moyasar approval: implement differentiated pricing (Mada/Visa/Cash) in widget checkout
- This checklist is not legal advice; final wording should be reviewed by qualified KSA legal counsel
