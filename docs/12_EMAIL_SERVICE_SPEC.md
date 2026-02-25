# AviaFrame — Email Service Specification

Version: 1.0
Date: 2026-02-25
Status: MVP spec — ready for implementation

---

## Overview

AviaFrame uses **Resend** as the transactional email provider. All emails are branded per agency — the end user sees only the agency's name, logo, and colors. AviaFrame branding is hidden.

Agencies can configure a custom sender domain (e.g., `tickets@myagency.com`) via DNS records (DKIM/SPF), so emails originate from their own domain.

---

## Architecture

```
Backend event trigger
  ↓
emailService.js
  ├── brandingResolver.js   → fetch WidgetConfig by agencyCode (logo, colors, sender name)
  ├── React Email template  → compile branded HTML email
  ├── pdfService.js         → generate PDF itinerary (for e-ticket emails only)
  └── Resend SDK            → send email
```

### File structure

```
backend/src/
  email/
    emailService.js           — orchestrator, single entry point
    brandingResolver.js       — fetches agency branding from Supabase
    pdfService.js             — PDF itinerary generator
    templates/
      invite-agent.tsx        — React Email template
      team-member-invite.tsx
      welcome.tsx
      password-reset.tsx
      new-login-alert.tsx
      booking-confirmation.tsx
      ticket-issued.tsx
      booking-cancelled.tsx
      payment-instructions.tsx
      pre-departure-reminder.tsx
      super-admin-alert.tsx
      monthly-usage-report.tsx
      plan-limit-warning.tsx
```

### emailService.js interface

```js
await emailService.send({
  type: 'ticket-issued',        // template name
  to: 'agent@myagency.com',
  agencyCode: 'MYAGENCY',       // used to resolve branding
  payload: { order, tickets },  // template variables
});
```

The service resolves agency branding automatically from `agencyCode`. Templates receive branding as props.

---

## Email Catalog

### Onboarding & Access Emails

#### 1. Agency Admin Invite
- **Trigger**: Super admin creates new agency and assigns agency_admin.
- **Recipient**: New agency_admin email.
- **Sender**: `noreply@aviaframe.com` (platform sends this one, agency not yet configured).
- **Subject**: `You've been invited to manage [Agency Name] on AviaFrame`
- **Content**:
  - AviaFrame logo (only this email is not fully whitelabeled — agency not set up yet).
  - Agency name, admin's name.
  - Magic link button: "Set up your account" (expires in 48h).
  - Next steps: configure widget, invite team.

#### 2. Team Member Invite
- **Trigger**: Agency admin invites a new agency_manager.
- **Recipient**: Invited user email.
- **Sender**: Agency configured sender (e.g., `hr@myagency.com`) or AviaFrame default.
- **Subject**: `[First Name], you've been invited to join [Agency Name]`
- **Branding**: Full agency branding.
- **Content**:
  - Agency logo, colors.
  - Invited by: [inviter name].
  - Role: Agent.
  - Magic link: "Accept Invitation" (expires in 48h).

#### 3. Welcome Email
- **Trigger**: First login after invite accepted.
- **Recipient**: New user.
- **Branding**: Full agency branding.
- **Subject**: `Welcome to [Agency Name] — your account is ready`
- **Content**: Agency logo, quick links to portal sections, support contact.

#### 4. Password Reset
- **Trigger**: User clicks "Forgot password".
- **Recipient**: User.
- **Branding**: Full agency branding.
- **Subject**: `Reset your [Agency Name] password`
- **Content**: Reset link (expires in 1h). If not requested — ignore instructions.

#### 5. New Login Alert
- **Trigger**: Login from new IP or unrecognized device.
- **Recipient**: Agency_admin (for own account) or super_admin.
- **Branding**: Agency branding or AviaFrame for super_admin.
- **Subject**: `New login to your [Agency Name] account`
- **Content**: Date, time, approximate location. CTA: "This wasn't me — lock account".

---

### Booking Lifecycle Emails (fully whitelabeled)

All booking emails use agency branding: logo, primary color, sender name, reply-to, footer.

#### 6. Booking Confirmation
- **Trigger**: `POST /api/orders` succeeds, status = BOOKED.
- **Recipients**: Agent (always) + traveler (if agency setting enabled).
- **Subject**: `Booking Confirmed — [Route] [Date] | Ref: [OrderRef]`
- **Content**:
  - Agency logo + colors.
  - Flight summary: route, dates, times, airline, flight number.
  - Passengers: names, types (ADT/CHD/INF).
  - Booking reference (internal + DRCT locator if available).
  - Status: BOOKED — awaiting ticket issuance.
  - Payment instructions link (if applicable).
  - Support contact from agency settings.

#### 7. E-Ticket + PDF Itinerary
- **Trigger**: `POST /api/orders/:id/issue` succeeds, status = ISSUED.
- **Recipients**: Agent (always) + traveler (if agency setting enabled).
- **Subject**: `Your e-ticket is ready — [Route] [Date] | Ticket: [TicketNumber]`
- **Content**:
  - Agency logo + colors.
  - Ticket number and DRCT locator.
  - Full itinerary: all segments (origin, destination, dates, times, airline, flight number, cabin, seat if available).
  - Passenger list with ticket numbers.
  - Baggage allowance per segment.
  - Check-in instructions and document requirements.
  - Support contact.
  - **PDF itinerary attached** (branded, see PDF spec below).

#### 8. Booking Cancelled
- **Trigger**: `POST /api/orders/:id/cancel` succeeds, status = CANCELLED.
- **Recipients**: Agent (always) + traveler (if enabled).
- **Subject**: `Booking Cancelled — [Route] [Date] | Ref: [OrderRef]`
- **Content**:
  - Agency logo + colors.
  - Cancelled booking summary.
  - Cancellation date and reason (if available from DRCT).
  - Refund information (if applicable — based on fare rules).
  - Support contact for questions.

#### 9. Payment Instructions
- **Trigger**: Order created, awaiting payment.
- **Recipients**: Traveler (or agent).
- **Subject**: `Payment Required — [Route] [Date] | Ref: [OrderRef]`
- **Content**:
  - Agency logo + colors.
  - Amount due, currency.
  - Payment deadline.
  - Payment methods / bank details (agency-configured static content).
  - What happens if payment is not received (booking expires).

#### 10. Pre-Departure Reminder
- **Trigger**: Scheduled job — 24h before departure_time for ISSUED orders.
- **Recipients**: Traveler (if email available) + agent.
- **Subject**: `Reminder: Your flight tomorrow — [Route]`
- **Content**:
  - Agency logo.
  - Flight details, terminal, check-in time recommendation.
  - Document requirements (passport validity, visa notes if configured).
  - Ticket number / locator.
  - Support contact.

---

### System / Operational Emails

#### 11. Super Admin Alert — Integration Failure
- **Trigger**: n8n workflow fails 3+ consecutive times (dead letter queue).
- **Recipient**: All super_admin users.
- **Sender**: AviaFrame system address.
- **Subject**: `[ALERT] DRCT integration failure — [workflow_name]`
- **Content**: Workflow name, error details, correlation ID, link to admin console.

#### 12. Monthly Usage Report
- **Trigger**: Scheduled — last day of each month.
- **Recipient**: Agency_admin.
- **Branding**: Agency branding.
- **Subject**: `[Agency Name] — Monthly Usage Report [Month Year]`
- **Content**: Searches, bookings, issues, cancels, current plan, remaining quota.

#### 13. Plan Limit Warning
- **Trigger**: Usage reaches 80% of plan quota.
- **Recipient**: Agency_admin.
- **Subject**: `[Agency Name] — You've used 80% of your monthly quota`
- **Content**: Current usage, limit, upgrade CTA.

#### 14. Plan Limit Exceeded
- **Trigger**: Usage reaches 100% of plan quota.
- **Recipient**: Agency_admin.
- **Subject**: `[Agency Name] — Monthly quota reached — action required`
- **Content**: Current usage, what's blocked, upgrade CTA.

---

## PDF Itinerary Specification

Generated using `@react-pdf/renderer`. Attached to e-ticket email.

### Branding
- Agency logo top-left.
- Primary color used for section headers and dividers.
- Agency name as document title.
- Agency support contact in footer.
- No AviaFrame branding.

### Content structure

```
[Agency Logo]                    [Agency Name]

ITINERARY / ROUTE SHEET

Passenger: John Doe
Ticket number: 157-XXXXXXXXX
Booking reference: ABCDEF
Issued: 15 Mar 2026 09:41 UTC

────────────────────────────────────────
OUTBOUND FLIGHT
Dubai (DXB) → Cairo (CAI)
FlyDubai FZ 123
Wed, 15 Mar 2026  |  08:30 → 10:15  (2h 45m)
Terminal: T2  |  Class: Economy  |  Seat: 14A
Baggage: 23kg checked + 7kg carry-on

────────────────────────────────────────
RETURN FLIGHT
Cairo (CAI) → Dubai (DXB)
FlyDubai FZ 124
Wed, 22 Mar 2026  |  14:00 → 17:45  (3h 45m)
Terminal: T1  |  Class: Economy
Baggage: 23kg checked + 7kg carry-on

────────────────────────────────────────
IMPORTANT INFORMATION
• Arrive at airport at least 2 hours before departure
• Passport must be valid for at least 6 months
• Check visa requirements for destination country

────────────────────────────────────────
[Support: support@myagency.com | +971 XX XXX XXXX]
[Footer: MyAgency Travel | Authorized by IATA]
```

---

## Agency Email Settings (configured in Agency Admin portal)

| Setting | Description | Required |
|---|---|---|
| Sender name | Display name in From field (e.g., "MyAgency Tickets") | Yes |
| Reply-to email | Where replies go (e.g., `support@myagency.com`) | Yes |
| Custom sender domain | Agency's own domain for sending (DKIM/SPF DNS setup) | Optional |
| Support phone | Shown in email footers | Optional |
| Custom footer text | Additional text in email footers | Optional |
| Send copy to traveler | Toggle: booking/ticket/cancel emails also sent to traveler | Optional |

### Custom Sender Domain Setup Flow
1. Agency admin enters domain in portal (e.g., `myagency.com`).
2. Portal shows DNS records to add: SPF, DKIM (3 TXT records).
3. Agency DNS admin adds records.
4. Portal shows verification status (Resend verifies automatically).
5. Once verified: all agency emails sent from that domain.

---

## Email Preview (Agency Admin Portal)

Agency admin can preview any email template with their own branding applied before any real send. Preview panel shows:
- Rendered HTML in email-client-like frame.
- From/subject line simulation.
- PDF itinerary preview (for ticket-issued template).

---

## Super Admin: Template Management

- View all global React Email templates.
- Edit template content (code editor with live preview).
- Send test email to any address.
- Template version history.
- Override template for specific agency (Enterprise tier).

---

## Technical Notes

### Resend SDK usage
```js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: `${agencyBranding.senderName} <${agencyBranding.senderEmail}>`,
  to: recipientEmail,
  subject: compiledSubject,
  html: compiledHtml,
  attachments: pdfAttachment ? [{ filename: 'itinerary.pdf', content: pdfBuffer }] : [],
  headers: { 'X-Correlation-ID': correlationId },
});
```

### Environment variables
```
RESEND_API_KEY=re_...
EMAIL_FROM_DEFAULT=noreply@aviaframe.com
EMAIL_FROM_NAME_DEFAULT=AviaFrame
```

### Failure handling
- Email send failure must NOT block the booking flow — log error, continue.
- Retry up to 3 times with exponential backoff.
- Failed sends logged to `email_send_log` table with status and error.
- Super admin alert if failure rate exceeds threshold.

---

## References

- [Resend documentation](https://resend.com/docs)
- [React Email](https://react.email)
- [@react-pdf/renderer](https://react-pdf.org)
- [docs/13_WIDGET_CUSTOMIZATION_SPEC.md](13_WIDGET_CUSTOMIZATION_SPEC.md) — Branding shared with widget
- [docs/02_PRD.md](02_PRD.md) — Product requirements
