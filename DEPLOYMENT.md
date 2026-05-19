# EverythingUTM Deployment

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor, or run `supabase db push` after logging in with the Supabase CLI.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The app uses Supabase as a shared `app_state` database and falls back to browser storage when the Supabase variables are missing.

For production Auth, enable Google in Supabase Auth Providers and configure a custom SMTP sender. Supabase's default email sender is rate-limited, so custom SMTP prevents the "email rate limit reached" issue for signup and password reset flows.

Deploy the included Edge Functions for account deletion and invisible bug-report emails:

```bash
supabase link --project-ref your-project-ref
supabase db push
supabase functions deploy report-bug
supabase functions deploy delete-account
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set BUG_REPORT_FROM="EverythingUTM <verified-sender@example.com>"
supabase secrets set BUG_REPORT_TO="hammau05@gmail.com"
```

Bug reports are sent through the `report-bug` Edge Function and also stored in
`public.bug_reports` with the email delivery status. Resend requires a verified
sender/domain for production delivery.

## Netlify

The included `netlify.toml` uses `npm run build`, publishes `dist`, and routes all app paths back to `index.html`.

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
