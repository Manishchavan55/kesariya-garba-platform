# Kesariya Garba Platform

A full-stack Navratri / Garba / Dandiya event platform based on the uploaded IT engineering requirements. The public site includes event information, ticket categories, booking, payment flow, QR tickets, gallery, FAQ and contact. The organizer side includes authentication, dashboard, bookings, QR verification and inquiries.

## What is implemented

- Premium responsive React + Vite + Tailwind website
- Navratri/Garba imagery from free-to-use Pexels pages
- Live countdown, floating diya/sparkle animations, marquee and hover motion
- Event story, date/time, venue, parking and entry guidance
- Multiple ticket categories with live demo inventory
- Booking form with dummy payment mode by default
- Razorpay integration path when credentials are configured
- Server-generated booking code and QR ticket
- QR verification with duplicate-scan protection
- Gallery and sponsor-ready API data
- FAQ accordion
- WhatsApp, phone, email and Google Maps links
- Contact/inquiry form
- Demo admin login and organizer dashboard
- Admin booking list, QR scanner and inquiry view
- MySQL schema covering events, ticket categories, bookings, payments, QR tickets, gallery, sponsors, inquiries and admin users
- Cloudflare Turnstile verification endpoint
- No workshop section

## Demo mode

The app is intentionally usable without MySQL or payment credentials. In `server/.env` keep:

```env
USE_MYSQL=false
```

Demo admin credentials:

```text
Email: admin@kesariya.test
Password: admin123
```

Demo QR token for testing duplicate-scan protection:

```text
KGR-DEMO-1001
```

The first scan is accepted and the second scan is rejected as a duplicate.

## Production mode

1. Copy `server/.env.example` to `server/.env`.
2. Set `USE_MYSQL=true` and configure MySQL.
3. Run `server/schema.sql`.
4. Add Razorpay test/live credentials.
5. Configure `TURNSTILE_SECRET_KEY`.
6. Replace demo admin authentication with your production identity/session strategy before deployment.
7. Replace demo organizer/event data with confirmed event, sponsor and gallery data.

## Run

```bash
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:5000`

## Requirements alignment

The uploaded PDF describes a React frontend, Node.js backend, MySQL data model, online payment, QR generation/verification, gallery, sponsors, inquiries and a secure admin panel. Those modules are represented in the current implementation. fileciteturn23file1L5-L8
