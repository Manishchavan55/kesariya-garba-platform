# Kesariya Garba Platform

A full-stack Navratri / Garba / Dandiya event platform based on the uploaded IT engineering requirements. The public site includes event information, ticket categories, booking, payment flow, QR tickets, gallery, FAQ and contact. The organizer side includes authentication, dashboard, bookings, QR verification and inquiries.

## Current status

**Demo-ready:** the complete local booking and entry flow has been tested, including ticket-price changes, booking, QR generation, one-time QR verification and duplicate-scan rejection.

**Production:** not yet enabled. Production launch requires the hardening steps in `DEPLOYMENT.md`, especially real Admin authentication, MySQL, Razorpay, HTTPS and production event data.

## What is implemented

- Premium responsive React + Vite website
- Navratri/Garba imagery and live motion effects
- Live countdown, floating diya/sparkle animations and moving gallery
- Event story, date/time, venue, parking and entry guidance
- Multiple ticket categories with live inventory
- Booking form with demo payment mode
- Razorpay integration path when credentials are configured
- Server-generated booking code and QR ticket
- QR verification with duplicate-scan protection
- Admin overview and booking list
- Admin ticket-price editing reflected on the public booking flow
- Camera/image QR scanning
- Gallery, sponsor-ready API data and FAQ
- WhatsApp, phone, email and map links
- Contact/inquiry form
- MySQL schema for events, tickets, bookings, payments, QR tickets, gallery, sponsors, inquiries and admin users
- Cloudflare Turnstile configuration endpoint
- No workshop section

## Demo mode

Keep the following in `server/.env` for local demo mode:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
USE_MYSQL=false
```

Demo Admin credentials:

```text
Email: admin@kesariya.test
Password: admin123
```

Demo QR token for duplicate-scan testing:

```text
KGR-DEMO-1001
```

The first scan is accepted and the second scan is rejected as a duplicate.

## Production mode

See `DEPLOYMENT.md` before exposing the application publicly.

At minimum:

1. Enable MySQL and run `server/schema.sql`.
2. Configure and test Razorpay.
3. Replace demo Admin authentication with real secure authentication.
4. Configure Turnstile and HTTPS.
5. Replace demo event/sponsor/gallery data.
6. Complete payment, QR-concurrency, mobile and recovery testing.

## Run locally

```bash
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:5000`

## Security note

Never commit `server/.env`, Razorpay secrets, database passwords or production Admin credentials. The repository `.gitignore` already excludes `.env` while allowing `.env.example` to remain tracked. 
