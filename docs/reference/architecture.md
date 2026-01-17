# Architecture

Technical overview of Pocket Money's architecture.

## Overview

Pocket Money is a SvelteKit application deployed on Cloudflare Pages with a D1 (SQLite) database.

```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare Pages                    │
│  ┌──────────────────────────────────────────────┐   │
│  │              SvelteKit App                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │   │
│  │  │ Routes  │  │  API    │  │   Server    │  │   │
│  │  │ (Pages) │  │ Routes  │  │   Hooks     │  │   │
│  │  └─────────┘  └─────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                        │                             │
│                        ▼                             │
│  ┌──────────────────────────────────────────────┐   │
│  │              Cloudflare D1                    │   │
│  │              (SQLite)                         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
pocket-money/
├── docs/                    # Documentation (this site)
├── migrations/              # D1 database migrations
├── src/
│   ├── lib/
│   │   ├── server/          # Server-only code
│   │   │   ├── auth.ts      # Authentication utilities
│   │   │   └── db.ts        # Database functions
│   │   ├── currencies.ts    # Currency definitions
│   │   └── utils.ts         # Shared utilities
│   ├── routes/              # SvelteKit routes
│   │   ├── api/             # API endpoints
│   │   │   └── cron/        # Recurring payment processor
│   │   ├── child/[id]/      # Child profile pages
│   │   ├── login/           # Authentication pages
│   │   ├── pin/             # PIN verification
│   │   ├── profile/         # User profile
│   │   ├── settings/        # App settings
│   │   └── +page.svelte     # Dashboard
│   ├── app.css              # Global styles
│   ├── app.d.ts             # TypeScript declarations
│   ├── app.html             # HTML template
│   └── hooks.server.ts      # Server hooks (auth, PIN check)
├── static/                  # Static assets
├── wrangler.toml            # Cloudflare configuration
└── package.json
```

## Authentication Flow

1. **Registration**: User creates account, optionally with invite code
   - With invite code: Joins existing family
   - Without invite code: New family created automatically

2. **Login**: Email/password verified, session created (30 days)

3. **Session Check**: `hooks.server.ts` validates session on each request

4. **PIN Check**: If enabled, PIN required after timeout period

## Data Isolation

All queries filter by `family_id` to ensure:

- Users can only see children in their family
- Settings are per-family
- Users cannot access other families' data

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login?/login` | User login |
| POST | `/login?/register` | User registration |
| POST | `/login?/logout` | User logout |
| GET | `/api/cron` | Process recurring payments |

All other data mutations use SvelteKit form actions.

## Security

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt (12 rounds) |
| PIN hashing | bcrypt (10 rounds) |
| Session cookies | httpOnly, secure, sameSite=lax |
| CSRF protection | SvelteKit form actions |
| Data isolation | Family-based filtering |

## Styling

- **Tailwind CSS** for utility classes
- Custom component classes in `app.css`
- Responsive design (mobile-first)
- Dark mode support via system preference
