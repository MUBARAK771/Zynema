This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Movie sources and playback

Configure TMDB on the server with either `TMDB_API_KEY` or `TMDB_API_READ_ACCESS_TOKEN`. The search results, movie details, cast and crew, trailers, and official watch-provider links continue to use TMDB.

The movie details page looks up possible Internet Archive matches in the background. It requires a matching title and release year (including TMDB alternative titles) and an explicit, recognized license URL before enabling a file. Public Domain Mark, CC0, CC BY, and CC BY-SA licenses are supported; unrecognized, non-commercial, missing, or conflicting rights are excluded. Attribution is shown when required. An Internet Archive record is not by itself proof that a movie is authorized.

Compatible MP4, WebM, Ogg, and browser-native HLS files can be played in the browser. HLS support varies by browser; unsupported formats display an error and remain downloadable only when their license permits it. Playback and downloads are revalidated against current Internet Archive metadata and use the original provider URL. Zynema does not proxy or store movie files.

No Internet Archive API key is required. Internet Archive availability, file quality, metadata, licensing assertions, CORS behavior, and download links are controlled by that service and may change. TMDB official provider links remain available as legal alternatives when no verified playable source is found.

## TV schedule and My List

The TV schedule is served through `/api/schedule` using TVMaze's country schedule for Nigeria. Use `date=YYYY-MM-DD` to select a date and `days=1` or `days=7` for a single day or a seven-day view. TVMaze only returns listings it has for the selected country, so an empty result means no entries were provided for those dates.

Movies and TV shows can be added to My List from their detail pages. Items are stored in Supabase per authenticated user and protected by Row Level Security. Apply `supabase/migrations/20261117120000_create_watchlist_items.sql` in the Supabase SQL Editor before using the database-backed list.

## Supabase dashboard authentication

Set `NEXT_SUPABASE_URL`, `NEXT_SUPABASE_ANON_KEY`, and the server-only `LOGIN_URL` in the dashboard deployment. `LOGIN_URL` must be the exact origin of the HTML login site (for example, `https://www.zynema-app.online`). Use the Supabase anon/publishable key, never a service-role key.

After login, the HTML app submits a top-level HTTPS form POST to `https://zynema-snowy.vercel.app/api/auth/handoff`. The dashboard validates the submitted Supabase access token with Supabase Auth, compares the returned user ID, then sets a Secure, HttpOnly cookie on the dashboard origin and redirects to a safe dashboard path. The access and refresh tokens are in the POST body, never in a URL. The dashboard refreshes the session server-side and saves rotated tokens back to the cookie.

The HTML app should submit `access_token`, `refresh_token`, `expires_at`, `user_id`, and a same-origin dashboard path in that form. Its browser request must include the login site's `Origin` header; the dashboard rejects other origins. The login page and the dashboard must both be served over HTTPS in production.

The watchlist API uses the user's verified access token and never a service-role key. `watchlist_items` policies require `auth.uid() = user_id` for reads and writes, so a client-supplied user ID cannot access another user's items.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
