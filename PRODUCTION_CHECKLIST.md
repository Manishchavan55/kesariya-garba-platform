# Production Readiness Checklist

## 1. Database

- [ ] Create a production MySQL database.
- [ ] Run `server/schema.sql`.
- [ ] Set `USE_MYSQL=true`.
- [ ] Use a dedicated MySQL user with only the permissions required by this application.
- [ ] Configure automated backups and test a restore.
- [ ] Do not commit `server/.env`.

## 2. Payments

- [ ] Create Razorpay test credentials first.
- [ ] Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` only in the server environment.
- [ ] Verify successful, failed and cancelled payment flows in Razorpay test mode.
- [ ] Confirm the server never marks an unpaid booking as confirmed.
- [ ] Switch to live Razorpay credentials only after test-mode QA is complete.

## 3. Admin security

- [ ] Replace the demo login (`admin@kesariya.test` / `admin123`) before public deployment.
- [ ] Use a strong, unique production admin password.
- [ ] Use a real session/token mechanism with expiration and revocation rather than the demo static token.
- [ ] Add login rate limiting and audit logging.
- [ ] Store password hashes, never plaintext passwords.

## 4. QR entry

- [ ] Test first scan = accepted.
- [ ] Test second scan = rejected.
- [ ] Test an unknown QR = rejected.
- [ ] Test concurrent scans against the MySQL path; the row lock must allow only one successful redemption.
- [ ] Use HTTPS for deployed camera scanning.

## 5. Application security

- [ ] Set `CLIENT_URL` to the exact production frontend origin.
- [ ] Enable HTTPS.
- [ ] Configure Cloudflare Turnstile with a production secret.
- [ ] Add HTTP security headers and request-rate limits at the application or reverse-proxy layer.
- [ ] Keep secrets out of Git and CI logs.

## 6. Event operations

- [ ] Replace demo event, gallery and sponsor data.
- [ ] Confirm ticket prices and inventory.
- [ ] Confirm venue, date, parking and entry rules.
- [ ] Test the admin price-change workflow.
- [ ] Test the scanner using real printed/mobile QR tickets.

## 7. Final QA

- [ ] Chrome desktop/mobile
- [ ] Edge/Brave
- [ ] iOS/Android camera QR scan
- [ ] Mobile responsive booking
- [ ] Booking refresh/recovery
- [ ] Server restart with MySQL enabled
- [ ] Database backup/restore
- [ ] Payment reconciliation
