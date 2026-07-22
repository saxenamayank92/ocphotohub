# Club PhotoHub

Club PhotoHub is a private, white-label photo-sharing platform for member clubs. The browser runs in local IndexedDB mode by default. Shared cloud mode uses a Cloudflare Worker API backed by R2 for image files and D1 for metadata.

The production resources retain their original `pictide` identifiers to avoid destructive infrastructure renames. Customer-facing branding is configured in `src/brand.js` and can be overridden with `VITE_CLUB_NAME`, `VITE_CLUB_SHORT_NAME`, and `VITE_CLUB_LOGO_URL`.

## Cloudflare setup

1. Create an R2 bucket named `pictide-photos`.
2. Create a D1 database named `pictide`.
3. Put the D1 database ID in `worker/wrangler.toml`.
4. For a new database, run `npx wrangler d1 execute pictide --remote --file=worker/schema.sql`. For the existing single-club database, apply migrations `003`, `004`, and `005` in numeric order exactly once. Migration `005` adds organization types, owner roles, 30-day trials, read-only expiry and the 25 GB storage limit.
5. Deploy the API with `npm run worker:deploy`.
6. Set the frontend environment variable `VITE_API_BASE_URL` to the Worker URL and redeploy the frontend.

The Worker uses server-side sessions and authorization. Every member, photo, like, reset, and session is scoped to a club on the server.

## Club onboarding and administration

A new club creates its own workspace from `/app?onboard=club`. The primary administrator supplies the club details and a work email, confirms a six-digit email code, and creates a password. The club and owner account are created together only after verification succeeds. Each administrator login is checked against that club's own `club_admins` record; administrators cannot select or manage another club through an authenticated session.

Organizations can create their own workspace from the public onboarding route. The primary administrator verifies their email before the workspace and owner account are created. New workspaces receive a full 30-day trial with no credit card. When the trial ends, gallery reads and downloads continue while uploads, likes, branding changes, roster mutations and deletions become read-only until the plan is activated. The launch plan is CAD $60 monthly or CAD $600 annually with 25 GB of photo storage.

The pre-existing Oakville deployment has a one-time compatibility path: its current Worker administrator credentials create the first Oakville `club_admins` account on the next successful login. That fallback is limited to Oakville and is disabled as soon as an active club administrator exists.

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

## Demo, marketing, and help centre

- `/` — product landing page, comparison, pricing, real demo imagery, and trial calls to action
- `/app?demo=1` — protected read-only “Your Club” member gallery demo
- `/features` — feature overview
- `/help/admin` and `/help/members` — administrator and member tutorials
- `/faq`, `/privacy`, and `/terms` — support and launch legal drafts

The original demo photographs live in `public/demo`. Regenerate the product screenshot and 30-second feature video with:

```bash
zsh scripts/render-feature-video.sh
```

The final video is written to `artifacts/video/club-photohub-feature.mp4`.

For the browser-style SaaS walkthrough, run:

```bash
zsh scripts/render-product-tour-video.sh
```

The 42-second product tour is written to `artifacts/video/club-photohub-product-tour.mp4` and covers onboarding, member verification, gallery interactions, uploads, administration, privacy controls, and pricing.

Club PhotoHub is operated by xTide Apps, uses `support@xtide.io` for support and privacy requests, and is published at `https://clubphotohub.xtide.io`. The supplied mailing address is `217-56A Mill St E, Ontario, L7J 1H3, Canada`. Obtain Canadian privacy/legal review before accepting paying customers.

During the DNS transition, the Worker accepts both `https://ocphotohub.xtide.io` and `https://clubphotohub.xtide.io`. `APP_ORIGIN` remains on the currently live `ocphotohub.xtide.io` fallback; reset emails use the validated request origin automatically. After the new DNS record is live, update `APP_ORIGIN` to `https://clubphotohub.xtide.io`.

## Native mobile shell

`capacitor.config.json` reserves `com.clubphotohub.app` and uses the Vite `dist` output. The current sandbox cannot reach npm, so the native packages and generated Xcode/Android Studio projects have not been installed in this checkout. When registry access is available:

```bash
npm install @capacitor/core@^8 @capacitor/ios@^8 @capacitor/android@^8 @capacitor/camera@^8 @capacitor/share@^8 @capacitor/status-bar@^8
npm install --save-dev @capacitor/cli@^8
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

Before store submission, verify photo permissions, in-app account deletion, privacy labels/data-safety disclosures, native download/share behavior, safe-area layout, app icons, signing, and real-device authenticated upload flows.

## Deployment

The frontend can remain on Vercel. The Worker is deployed separately to Cloudflare and accessed through `VITE_API_BASE_URL`.
