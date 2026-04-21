# Sales Portal

Next.js 14 sales portal with admin panel. All config persists in JSON files.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Default credentials

Admin: admin@yourdomain.com / changeme123
User: salesperson@yourdomain.com / sales123

**Change these in /data/users.json before deploying.**

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Deploy — zero config needed

## How it works

- All configuration (buttons, prompts, AI settings, users) lives in /data/*.json
- Admin panel at /admin — manage everything from the UI, no code changes needed
- Changes save to JSON files on disk and persist across restarts and deploys (when committed)
- Salesperson portal at /portal — sidebar buttons defined in admin, content area changes per button

## Adding AI credentials

Go to /admin → AI Settings and enter your API keys. They save to /data/config.json.
