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

### Screenshot Script

The script at `scripts/capture-screenshots.ts`:
- Launches a headless browser at 1280x800
- Registers a test user
- Navigates through the app capturing key screens
- Saves screenshots to the docs folder

If the UI changes significantly, you may need to update the script selectors.

## Running Tests

Currently there are no automated tests. Contributions to add tests are welcome!

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Use Tailwind CSS for styling
- Keep components small and focused
