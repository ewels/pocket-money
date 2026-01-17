# Architecture

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
├── docs/                    # Documentation
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

## Database Schema

### Tables

**families**
- `id` (TEXT, PK) - UUID
- `name` (TEXT) - Family name
- `created_at` (INTEGER) - Unix timestamp

**users**
- `id` (TEXT, PK) - UUID
- `email` (TEXT, UNIQUE)
- `password_hash` (TEXT)
- `name` (TEXT)
- `photo_url` (TEXT, nullable)
- `photo_data` (TEXT, nullable) - Base64 image
- `family_id` (TEXT, FK -> families)
- `created_at` (INTEGER)

**invite_codes**
- `id` (TEXT, PK) - UUID
- `code` (TEXT, UNIQUE) - 8-char alphanumeric
- `family_id` (TEXT, FK -> families)
- `created_by` (TEXT, FK -> users)
- `expires_at` (INTEGER) - Unix timestamp
- `used_by` (TEXT, FK -> users, nullable)
- `used_at` (INTEGER, nullable)
- `created_at` (INTEGER)

**settings**
- `id` (INTEGER, PK)
- `family_id` (TEXT, FK -> families)
- `currency` (TEXT, default 'EUR')
- `pin_enabled` (INTEGER, default 0)
- `pin_hash` (TEXT, nullable)
- `pin_timeout_minutes` (INTEGER, default 1)

**children**
- `id` (TEXT, PK) - UUID
- `name` (TEXT)
- `color` (TEXT)
- `photo_url` (TEXT, nullable)
- `photo_data` (TEXT, nullable)
- `family_id` (TEXT, FK -> families)
- `sort_order` (INTEGER)
- `created_at` (INTEGER)

**saving_targets**
- `id` (TEXT, PK) - UUID
- `child_id` (TEXT, FK -> children)
- `name` (TEXT)
- `target_amount` (REAL)
- `sort_order` (INTEGER)
- `created_at` (INTEGER)

**recurring_rules**
- `id` (TEXT, PK) - UUID
- `child_id` (TEXT, FK -> children)
- `amount` (REAL)
- `description` (TEXT, nullable)
- `interval_days` (INTEGER)
- `next_run_at` (INTEGER) - Unix timestamp
- `skip_next` (INTEGER, default 0)
- `active` (INTEGER, default 1)
- `created_at` (INTEGER)

**transactions**
- `id` (TEXT, PK) - UUID
- `child_id` (TEXT, FK -> children)
- `user_id` (TEXT, FK -> users, nullable)
- `amount` (REAL) - Positive for deposits, negative for withdrawals
- `description` (TEXT, nullable)
- `is_recurring` (INTEGER, default 0)
- `recurring_rule_id` (TEXT, FK -> recurring_rules, nullable)
- `created_at` (INTEGER)

**sessions**
- `id` (TEXT, PK) - UUID
- `user_id` (TEXT, FK -> users)
- `pin_verified_at` (INTEGER, nullable)
- `expires_at` (INTEGER)
- `created_at` (INTEGER)

### Relationships

```
families
    │
    ├── users (many)
    ├── children (many)
    ├── settings (one)
    └── invite_codes (many)

children
    ├── saving_targets (many)
    ├── recurring_rules (many)
    └── transactions (many)
```

## Authentication Flow

1. **Registration**: User creates account, optionally with invite code
   - With invite code: Joins existing family
   - Without invite code: New family created automatically

2. **Login**: Email/password verified, session created (30 days)

3. **Session Check**: `hooks.server.ts` validates session on each request

4. **PIN Check**: If enabled, PIN required after timeout period

## Data Isolation

- All queries filter by `family_id`
- Children can only be viewed/edited by family members
- Settings are per-family
- Users cannot access other families' data

## API Endpoints

**POST /login?/login** - User login
**POST /login?/register** - User registration
**POST /login?/logout** - User logout

**GET /api/cron** - Process recurring payments

All other routes use SvelteKit form actions for data mutations.

## Security

- Passwords hashed with bcrypt (12 rounds)
- PINs hashed with bcrypt (10 rounds)
- Session cookies: httpOnly, secure, sameSite=lax
- CSRF protection via SvelteKit's form actions
- Family-based data isolation

## Styling

- Tailwind CSS for utility classes
- Custom component classes in `app.css`
- Responsive design (mobile-first)

## Deployment

- Cloudflare Pages for hosting
- Cloudflare D1 for database
- Wrangler for deployment CLI
- Git-based deployments supported
