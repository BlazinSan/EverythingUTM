# EverythingUTM Deployment

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The app uses Supabase as a shared `app_state` database and falls back to browser storage when the Supabase variables are missing.

## Netlify

The included `netlify.toml` uses `npm run build`, publishes `dist`, and routes all app paths back to `index.html`.

## Vercel

The included `vercel.json` builds with `npm run build`, serves `dist`, and rewrites routes to the React app shell.

## Android

The app is also configured for Android with Capacitor.

```bash
npm run android:sync
npm run android:open
```

Build the APK from Android Studio or run `android/gradlew assembleDebug` after installing a JDK and setting `JAVA_HOME`.
