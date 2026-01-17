# Installation

This guide covers setting up Pocket Money for local development.

## Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)
- Wrangler CLI (`npm install -g wrangler`)

## Clone and Install

```bash
git clone https://github.com/ewels/pocket-money.git
cd pocket-money
npm install
```

## Configure Environment

Create the local secrets file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set a secure random string for `SESSION_SECRET`:

```
SESSION_SECRET=your-secure-random-string-here
```

You can generate a secure secret with:

```bash
openssl rand -base64 32
```

## Set Up Database

Copy the wrangler config template:

```bash
cp wrangler.toml.example wrangler.toml
```

Create a D1 database:

```bash
wrangler d1 create pocket-money-db
```

This will output a database ID. Update `wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pocket-money-db"
database_id = "your-database-id-here"
```

## Run Migrations

Apply the database schema:

```bash
npm run db:migrate
```

## Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Regenerating Screenshots

The documentation includes screenshots that may need updating after UI changes.

To regenerate all screenshots:

1. Reset the local database for a fresh state:
   ```bash
   rm -rf .wrangler
   npm run db:migrate
   wrangler d1 execute pocket-money-db --local --file=./migrations/0002_photo_data.sql
   wrangler d1 execute pocket-money-db --local --file=./migrations/0003_families.sql
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. In another terminal, run the screenshot script:
   ```bash
   npm run screenshots
   ```

This will capture fresh screenshots and save them to `docs/assets/screenshots/`.

## Next Steps

Ready to deploy? See the [Deployment Guide](deployment.md).
