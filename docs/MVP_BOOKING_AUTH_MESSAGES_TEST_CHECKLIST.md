# MVP Booking/Auth/Messages - Test Checklist

## 1. Payment Method on Booking
- [ ] Passenger step shows `cash` and `bank_transfer` as radio options.
- [ ] `online` appears disabled (if enabled later, remove this check).
- [ ] Widget order create payload includes `payment_method`.
- [ ] Created order has `payment_method` and `payment_status=pending`.

## 2. Progressive Account Creation
- [ ] Booking success screen displays order number.
- [ ] "Create account" path works with Google OAuth.
- [ ] "Create account" path works with email OTP.
- [ ] After auth + claim token, user is redirected to My Bookings.
- [ ] Claimed order appears in My Bookings.

## 3. Claim Token Security
- [ ] Invalid token returns 404.
- [ ] Expired token returns 410.
- [ ] Token for different contact email is rejected (403).
- [ ] Token cannot be reused after successful claim.

## 4. Messages Thread (Client ↔ Agency)
- [ ] Client can fetch own order thread.
- [ ] Client can send message in own order.
- [ ] Agent can fetch/send messages for own agency order.
- [ ] Unauthorized user cannot access another order thread.
- [ ] Mark read endpoint updates read timestamps.

## 5. Role/Scope
- [ ] Admin sees all scoped data as expected.
- [ ] Agent only sees orders in own agency (plus own created where applicable).
- [ ] Client only sees claimed own orders.

## 6. Operational
- [ ] Netlify env has correct `BACKEND_URL` (reachable).
- [ ] `/api/n8n/webhook-test/drct/search` returns non-504.
- [ ] n8n workflow `drct/search` is active and receives POSTs.

