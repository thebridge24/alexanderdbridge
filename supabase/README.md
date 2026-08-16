# Supabase Backend Setup

This app stores devotional engagement data in Supabase:

- **Comments** per devotional date (`YYYY-MM-DD`)
- **View counts** with one count per browser session
- **Like counts** with per-session toggle support

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Copy your project URL and API keys from **Project Settings → API**.

## 2. Run the migration

In the Supabase SQL editor, run:

`supabase/migrations/001_devotional_engagement.sql`

This creates:

- `devotional_comments`
- `devotional_views`
- `devotional_view_sessions`
- `devotional_likes`
- `devotional_like_sessions`
- RPC functions `increment_devotional_view` and `toggle_devotional_like`

## 3. Configure environment variables

Copy `.env.example` to `.env.local` in the app root and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The API routes use the service role key server-side only.

## 4. Start the app

```bash
npm install
npm run dev
```

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/devotionals/[date]/comments` | GET | List comments for a date |
| `/api/devotionals/[date]/comments` | POST | Create a comment |
| `/api/devotionals/[date]/stats` | GET | Get view/like counts |
| `/api/devotionals/[date]/view` | POST | Increment view count (session deduped) |
| `/api/devotionals/[date]/like` | POST | Toggle like for current session |

Devotional content itself remains in `app/devotionalData.ts` and is keyed by `dateString`.
