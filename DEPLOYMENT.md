# EverythingUTM Deployment

## Clerk + Convex

1. Create a Clerk application and enable Email plus Google sign-in.
2. Create a Convex project with `npx convex dev`.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL`.
5. Set Convex auth with your Clerk issuer:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-app.clerk.accounts.dev
```

The app uses Clerk for account creation, password reset, Google sign-in, and
sign-out. Convex stores profiles, synced app state, and bug-report records.

For bug-report emails, set these Convex environment variables:

```bash
npx convex env set CLERK_SECRET_KEY sk_live_or_test_server_side_key
npx convex env set RESEND_API_KEY your-resend-key
npx convex env set BUG_REPORT_FROM "EverythingUTM <verified-sender@example.com>"
npx convex env set BUG_REPORT_TO "hammau05@gmail.com"
```

Bug reports are sent through a Convex action and stored with the email delivery
status. Resend requires a verified sender/domain for production delivery.

## Netlify

The included `netlify.toml` deploys Convex and the frontend together:

```bash
node scripts/validate-netlify-env.mjs && npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
```

Add these Netlify environment variables: `CONVEX_DEPLOY_KEY` and
`VITE_CLERK_PUBLISHABLE_KEY`. Convex injects `VITE_CONVEX_URL` during the build
through `--cmd-url-env-var-name VITE_CONVEX_URL`.

Remove the old `VITE_SUPABASE_*` variables from Netlify so the site settings
match the current Clerk + Convex stack.

```bash
netlify deploy --prod --dir=dist --site everythingutm
```

## Vercel

The included `vercel.json` builds with `npm run build`, serves `dist`, and rewrites routes to the React app shell.

## Android

The app is also configured for Android with Capacitor.

```bash
npm run android:sync
npm run android:open
```

Build the APK from Android Studio or run `android/gradlew assembleDebug` after installing a JDK and setting `JAVA_HOME`.
