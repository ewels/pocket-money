# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Money is a family pocket money tracking PWA built with:

- **SvelteKit** (Svelte 5 with runes)
- **Cloudflare Pages** (hosting)
- **Cloudflare D1** (SQLite database)
- **Tailwind CSS** (styling)
- **Chart.js** (balance history charts)

## Key URLs

- **GitHub Repository**: https://github.com/ewels/pocket-money
- **Documentation**: https://ewels.github.io/pocket-money/
- **Author Website**: https://phil.ewels.co.uk

## Key Architecture Decisions

### Family System

- Each user belongs to exactly one family
- Children belong to a family
- Users can only see/edit children in their family
- Invite codes allow users to join existing families
- Settings (currency, PIN) are per-family

### Authentication

- Password hashing: bcrypt, 12 rounds
- Sessions: 30-day cookies, stored in D1
- Optional PIN protection with configurable timeout

### Data Storage

- All IDs are UUIDs (crypto.randomUUID())
- Timestamps are Unix timestamps (seconds)
- Photos stored as base64 in `photo_data` column
- Transactions use positive amounts for deposits, negative for withdrawals

## File Structure

### Core Files

- `src/lib/server/db.ts` - All database functions and types
- `src/lib/server/auth.ts` - Authentication utilities (password hashing, sessions)
- `src/hooks.server.ts` - Request hooks (auth check, PIN verification)
- `src/app.d.ts` - TypeScript type declarations for locals

### Routes

- `/` - Dashboard (children list)
- `/login` - Login and registration
- `/pin` - PIN entry screen
- `/profile` - User profile editing
- `/settings` - App settings (currency, PIN, family management)
- `/child/[id]` - Child profile (balance, transactions)
- `/child/[id]/config` - Child settings (targets, recurring rules)
- `/api/cron` - Recurring payment processor (called externally)

## Common Patterns

### SvelteKit Form Actions

All mutations use SvelteKit form actions, not API endpoints:

```typescript
export const actions: Actions = {
	actionName: async ({ request, platform, locals }) => {
		// Validate auth
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Get DB
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Process form data
		const formData = await request.formData();
		// ...

		return { success: 'Message' };
	}
};
```

### Family-Scoped Queries

Always filter by family_id:

```typescript
// Good
const children = await getChildren(db, locals.user.family_id);

// Bad - exposes all data
const children = await db.prepare('SELECT * FROM children').all();
```

### Verifying Resource Ownership

Before showing/editing a resource, verify family ownership:

```typescript
const child = await getChild(db, params.id);
if (!child) {
	throw error(404, 'Child not found');
}
if (child.family_id !== locals.user.family_id) {
	throw error(403, 'Access denied');
}
```

## Database Migrations

Located in `migrations/`. Run in order by number prefix.

To add a new migration:

1. Create `migrations/NNNN_description.sql`
2. Run locally: `npm run db:migrate`
3. Run in production: `npm run db:migrate:prod`

## Development Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run db:migrate       # Run local migrations
npm run db:migrate:prod  # Run production migrations
npm run screenshots      # Regenerate documentation screenshots
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
```

## Testing

Tests use **Vitest** and are located alongside source files with `.test.ts` extension.

```bash
npm run test        # Watch mode (re-runs on file changes)
npm run test:run    # Run once (for CI)
```

Test files:

- `src/lib/currencies.test.ts` - Currency formatting tests
- `src/lib/utils.test.ts` - Utility function tests (initials, dates, progress, intervals)
- `src/lib/server/auth.test.ts` - Password/PIN hashing tests
- `src/lib/server/db.test.ts` - UUID/invite code generation tests

## Git Hooks

The project uses **Husky** for git hooks. These run automatically after `npm install`.

### Pre-commit (on every commit)

- Prettier formats staged files
- ESLint checks staged `.js`, `.ts`, and `.svelte` files

### Pre-push (before pushing)

- Format check (`npm run format:check`)
- Lint (`npm run lint`)
- Type check (`npm run check`)
- Tests (`npm run test:run`)

This catches CI failures locally before pushing.

## Code Quality

- **ESLint**: TypeScript + Svelte rules. Run `npm run lint` to check.
- **Prettier**: Consistent formatting. Run `npm run format` to auto-fix.
- **TypeScript**: Run `npm run check` for type checking.

## Documentation Screenshots

The docs include screenshots in `docs/assets/screenshots/`. After UI changes, regenerate them:

1. Reset local database: `rm -rf .wrangler && npm run db:migrate`
2. Start dev server: `npm run dev`
3. Run: `npm run screenshots`

The script at `scripts/capture-screenshots.ts` automates capturing all screens. See `CONTRIBUTING.md` for details.

## Documentation notes

Admonitions use the following syntax:

```md
!!! tip "Some title"
You can write arbitrary text here.
```

Do not write admontions with `:::` syntax, that doesn't work.
Docs are built using Zensical.

## Testing Locally

1. Copy `.dev.vars.example` to `.dev.vars`
2. Run `npm run db:migrate`
3. Run `npm run dev`
4. Register a new user (creates family automatically)
5. Add children, make transactions, test features

## Common Tasks

### Adding a New Setting

1. Add column to `settings` table (new migration)
2. Update `Settings` type in `db.ts`
3. Update `getSettings()` return value
4. Update `updateSettings()` parameters and query
5. Add UI in `/settings/+page.svelte`

### Adding a New Child Property

1. Add column to `children` table (new migration)
2. Update `Child` type in `db.ts`
3. Update `createChild()` to accept and insert the value
4. Update `updateChild()` to handle updates
5. Update relevant UI components

### Adding a New Route

1. Create `src/routes/newroute/+page.svelte` and `+page.server.ts`
2. Add auth check in load function
3. Add family ownership verification for any resources
4. Use form actions for mutations

## Gotchas

- Svelte 5 uses runes (`$state`, `$derived`, `$effect`) not stores
- D1 uses SQLite syntax, not PostgreSQL
- Cloudflare Workers have no Node.js APIs (use Web APIs)
- `locals.user.family_id` may be null for legacy users pre-migration
- Invite codes are uppercase, 8 chars, no ambiguous characters (0/O, 1/I/L)

## Security Considerations

- Never expose users from other families
- Always verify family ownership before mutations
- Use parameterized queries (`.bind()`) to prevent SQL injection
- Validate all form inputs server-side
- Don't store sensitive data in client-side state
