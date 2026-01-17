# Installation & Deployment

## Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)
- Wrangler CLI (`npm install -g wrangler`)

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/ewels/pocket-money.git
cd pocket-money
npm install
```

### 2. Configure Environment

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

### 3. Set Up Database

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

### 4. Run Migrations

Apply the database schema:

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Production Deployment

### 1. Create Production Database

If you haven't already, copy the config template and create a database:

```bash
cp wrangler.toml.example wrangler.toml
wrangler d1 create pocket-money-db
```

Update `wrangler.toml` with the database ID from the command output.

### 2. Set Production Secrets

```bash
wrangler secret put SESSION_SECRET
```

Enter a secure random string when prompted.

### 3. Run Production Migrations

```bash
npm run db:migrate:prod
```

### 4. Deploy

```bash
npm run build
wrangler pages deploy .svelte-kit/cloudflare
```

### 5. Set Up Recurring Payments (Optional)

The app has an endpoint `/api/cron` that processes recurring payments. You need to call this endpoint daily for allowances to be deposited automatically.

**Option A: GitHub Actions (Recommended)**

If you've forked this repo to GitHub, you can use the included GitHub Action:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CRON_URL`
5. Value: `https://your-app.pages.dev/api/cron`
6. Click **Add secret**

The workflow runs daily at 6:00 AM UTC. You can also trigger it manually from the **Actions** tab.

**Option B: External Cron Service**

Use a free service like [cron-job.org](https://cron-job.org) to call your endpoint daily:

```
GET https://your-app.pages.dev/api/cron
```

**Option C: Manual**

Visit `/api/cron` in your browser when you want to process recurring payments.

## Database Migrations

### Running Migrations

Local:
```bash
npm run db:migrate
```

Production:
```bash
npm run db:migrate:prod
```

### Migration Files

Migrations are stored in `migrations/` and run in order:

- `0001_initial.sql` - Core tables
- `0002_photo_data.sql` - Photo storage columns
- `0003_families.sql` - Family system tables

## Troubleshooting

### "Database not available" errors

Ensure your `wrangler.toml` has the correct database ID and the database has been created.

### Migrations fail

Check that you're running the correct migration command (local vs production). For local development, the database is created automatically when running `wrangler dev`.

### Login issues

Clear your browser cookies for the app domain and try again. The session cookie may be invalid.

### Photos not uploading

Photos are stored as base64 in the database. Very large images may fail due to D1 row size limits. Try using smaller images (the app auto-resizes to 200px).
