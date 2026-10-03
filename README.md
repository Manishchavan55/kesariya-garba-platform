# Kesariya Garba Platform

Full-stack event booking starter built with:

- Node.js + Express
- MySQL
- Razorpay
- Cloudflare Turnstile verification endpoint
- React + Vite
- Tailwind CSS

## Structure

```
kesariya-garba-platform/
├── package.json
├── server/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── schema.sql
└── client/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── index.css
```

## Setup

1. Copy `server/.env.example` to `server/.env` and set your local credentials.
2. Create the MySQL database/tables using `server/schema.sql`.
3. Run `npm run install:all`.
4. Run `npm run dev`.

The frontend runs on port 5173 and the API on port 5000.
