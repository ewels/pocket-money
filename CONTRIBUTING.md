# Contributing to Pocket Money

## Development Setup

See [Installation](docs/getting-started/installation.md) for setting up your development environment.

## Regenerating Screenshots

The documentation includes screenshots that may need updating after UI changes.

### Prerequisites

- Local dev server running
- Fresh local database

### Steps

1. Reset the local database for a fresh state:

   ```bash
   rm -rf .wrangler
   npm run db:migrate
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

### Screenshot Script

The script at `scripts/capture-screenshots.ts`:

- Launches a headless browser at 1280x800
- Registers a test user
- Navigates through the app capturing key screens
- Saves screenshots to the docs folder

If the UI changes significantly, you may need to update the script selectors.

## Running Tests

Tests use Vitest:

```bash
npm run test        # Run in watch mode (re-runs on changes)
npm run test:run    # Run once (used in CI)
```

Test files are located alongside source files with a `.test.ts` extension:

- `src/lib/currencies.test.ts` - Currency formatting
- `src/lib/server/auth.test.ts` - Password and PIN hashing
- `src/lib/server/db.test.ts` - ID and invite code generation

## Git Hooks

The project uses Husky for git hooks. After running `npm install`, hooks run automatically:

### Pre-commit

- Prettier formats staged files
- ESLint checks staged files

If either fails, the commit is blocked until you fix the issues.

### Pre-push

Before pushing, the full CI suite runs locally:

- Format check
- Lint
- Type check
- Tests

If any check fails, the push is blocked. This catches CI failures before they reach GitHub.

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run test:run` to check for issues
5. Test locally with `npm run dev`
6. Submit a pull request

The CI workflow will run lint, type checking, tests, and build on your PR.

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Use Tailwind CSS for styling
- Keep components small and focused
- Format with Prettier: `npm run format`
- Lint with ESLint: `npm run lint`
