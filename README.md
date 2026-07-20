# Club PhotoHub

Club PhotoHub is a private, white-label photo-sharing platform for member clubs. The browser runs in local IndexedDB mode by default. Shared cloud mode uses a Cloudflare Worker API backed by R2 for image files and D1 for metadata.

The production resources retain their original `pictide` identifiers to avoid destructive infrastructure renames. Customer-facing branding is configured in `src/brand.js` and can be overridden with `VITE_CLUB_NAME`, `VITE_CLUB_SHORT_NAME`, and `VITE_CLUB_LOGO_URL`.

## Cloudflare setup

1. Create an R2 bucket named `pictide-photos`.
2. Create a D1 database named `pictide`.
3. Put the D1 database ID in `worker/wrangler.toml`.
4. For a new database, run `npx wrangler d1 execute pictide --remote --file=worker/schema.sql`. For the existing single-club database, apply `worker/migrations/003_multiclub_email_verification.sql` once.
5. Deploy the API with `npm run worker:deploy`.
6. Set the frontend environment variable `VITE_API_BASE_URL` to the Worker URL and redeploy the frontend.

The Worker uses server-side sessions and authorization. Every member, photo, like, reset, and session is scoped to a club on the server.

## Member registration and password reset

Club admins preload member number, name, and roster email. On first login, a member selects their club, matches their member number and last name, enters the roster email, and confirms a six-digit code sent to that address before creating a password. Passwords are hashed in D1. Verification and password-reset email delivery require these Worker secrets/variables:

```bash
npx wrangler secret put MAILERSEND_API_TOKEN --config worker/wrangler.toml
npx wrangler secret put MAIL_FROM --config worker/wrangler.toml
```

`MAIL_FROM` must be a sender address accepted by the email provider. The reset route uses short-lived, single-use hashed tokens and returns a generic response whether or not a matching member exists.

## Local development

```bash
npm install
npm run dev
```

Without `VITE_API_BASE_URL`, the app uses local IndexedDB and localStorage.

## Deployment

The frontend can remain on Vercel. The Worker is deployed separately to Cloudflare and accessed through `VITE_API_BASE_URL`.
