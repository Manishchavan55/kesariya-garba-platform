# Kesariya Garba Platform — Demo & Production Checklist

## Demo-ready status

The current repository is ready for a local/demo event flow:

- Public ticket browsing and booking
- Live ticket-price updates from the Admin panel
- Demo payment mode
- Booking code + QR generation
- One-time QR entry verification
- Duplicate QR rejection
- Admin overview
- Admin ticket-price management
- Admin booking list
- Responsive public/admin UI
- Animated gallery and Navrang visual system

### Demo environment

`server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
USE_MYSQL=false
```

Demo Admin:

```text
Email: admin@kesariya.test
Password: admin123
```

Demo QR:

```text
KGR-DEMO-1001
```

## Before a public/paid launch

The following items are required before calling the deployment production-ready:

1. Enable MySQL with `USE_MYSQL=true` and run `server/schema.sql`.
2. Configure Razorpay test keys, complete end-to-end test payments, then switch to live keys only after verification.
3. Replace the demo Admin login/token with a real authenticated session mechanism and a password hash stored outside source code.
4. Keep `server/.env` out of Git; only `.env.example` belongs in the repository.
5. Set `CLIENT_URL` to the deployed frontend origin and serve the application over HTTPS.
6. Configure Cloudflare Turnstile with the production secret and verify it on the relevant public forms.
7. Configure production email/SMS delivery if booking confirmations need to be sent automatically.
8. Verify QR redemption under concurrent scans so one ticket cannot be accepted twice at the same time.
9. Replace placeholder event, sponsor, gallery and contact data with final event information.
10. Back up MySQL and define a restore procedure before the event.
11. Test the complete flow on at least one desktop browser and one physical Android/iPhone device.
12. Run a final payment/refund/reconciliation test with the payment gateway before opening sales.

## Recommended release sequence

```text
Demo QA
  -> MySQL staging
  -> Razorpay test mode
  -> Admin/auth hardening
  -> QR concurrency test
  -> Mobile/device QA
  -> Production environment
  -> Razorpay live mode
```

Do not publish the demo Admin credentials or use them for a public deployment.
