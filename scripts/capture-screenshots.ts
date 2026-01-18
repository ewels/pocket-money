/**
 * Screenshot Capture Script
 *
 * Captures screenshots of the app for documentation.
 * Run with: npm run screenshots
 *
 * Prerequisites:
 * - Local dev server running: npm run dev
 * - Fresh local database: rm -rf .wrangler && npm run db:migrate
 */

import { chromium, type Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '../docs/assets/screenshots');

const VIEWPORT = { width: 1280, height: 800 };

// Test user credentials
const TEST_USER = {
	name: 'Test User',
	email: `test-${Date.now()}@example.com`, // Unique email for fresh run
	password: 'password123'
};

async function screenshot(page: Page, name: string, fullPage = false) {
	const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
	await page.screenshot({ path: filepath, fullPage });
	console.log(`  Captured: ${name}.png`);
}

async function main() {
	console.log('Starting screenshot capture...\n');

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: VIEWPORT });
	const page = await context.newPage();

	try {
		// ============================================
		// Login & Registration Screenshots
		// ============================================
		console.log('1. Login & Registration');

		await page.goto(`${BASE_URL}/login`);
		await page.waitForLoadState('networkidle');
		await screenshot(page, 'login');

		// Show registration form
		await page.click("text=Don't have an account? Register");
		await page.waitForTimeout(300);
		await screenshot(page, 'register', true);

		// ============================================
		// Register and access app
		// ============================================
		console.log('\n2. Registering test user...');

		await page.fill('input[name="name"]', TEST_USER.name);
		await page.fill('input[name="email"]', TEST_USER.email);
		await page.fill('input[name="password"]', TEST_USER.password);
		await page.fill('input[name="confirmPassword"]', TEST_USER.password);
		await page.click('button:has-text("Create account")');
		await page.waitForURL(`${BASE_URL}/`);
		await page.waitForLoadState('networkidle');

		// ============================================
		// Dashboard Screenshots
		// ============================================
		console.log('\n3. Dashboard');

		await screenshot(page, 'dashboard-empty');

		// Add a child
		await page.click('button:has-text("Add Child")');
		await page.waitForSelector('text=Add Child >> visible=true');
		await screenshot(page, 'add-child-modal');

		await page.fill('input[name="name"]', 'Emma');
		await page.click('button[aria-label="Select purple"]');
		await page.locator('.fixed.inset-0.z-50 form button[type="submit"]').click({ force: true });
		await page.waitForTimeout(500);
		await screenshot(page, 'dashboard');

		// ============================================
		// Child Profile Screenshots
		// ============================================
		console.log('\n4. Child Profile');

		await page.click('text=Emma');
		await page.waitForURL(/\/child\//);
		await page.waitForLoadState('networkidle');
		await screenshot(page, 'child-profile');

		// Add money
		await page.click('button:has-text("Add Money")');
		await page.waitForSelector('text=Add Money >> visible=true');
		await page.fill('input#addAmount', '25');
		await page.fill('input#addDescription', 'Birthday money');
		await screenshot(page, 'add-money-modal');

		await page.locator('.fixed.inset-0.z-50 form button[type="submit"]').click({ force: true });
		await page.waitForTimeout(500);
		await screenshot(page, 'child-profile-with-transaction');

		// ============================================
		// Child Settings Screenshots
		// ============================================
		console.log('\n5. Child Settings');

		await page.click('a.btn-secondary:has-text("Settings")');
		await page.waitForURL(/\/config/);
		await page.waitForLoadState('networkidle');
		await screenshot(page, 'child-settings', true);

		// Add saving target
		await page.click('button:has-text("Add Target")');
		await page.waitForSelector('text=Add Saving Target >> visible=true');
		await page.fill('input#targetName', 'New bicycle');
		await page.fill('input#targetAmount', '150');
		await page.locator('.fixed.inset-0.z-50 form button[type="submit"]').click({ force: true });
		await page.waitForTimeout(500);

		// Add recurring payment
		await page.click('button:has-text("Add Rule")');
		await page.waitForSelector('text=Add Recurring Payment >> visible=true');
		await page.fill('input#recurringAmount', '5');
		await page.fill('input#recurringDescription', 'Weekly allowance');
		await screenshot(page, 'add-recurring-modal');

		await page.locator('.fixed.inset-0.z-50 form button[type="submit"]').click({ force: true });
		await page.waitForTimeout(500);
		await screenshot(page, 'child-settings-configured', true);

		// ============================================
		// App Settings Screenshots
		// ============================================
		console.log('\n6. App Settings');

		await page.click('a:has-text("Settings") >> nth=0');
		await page.waitForURL(`${BASE_URL}/settings`);
		await page.waitForLoadState('networkidle');
		await screenshot(page, 'settings', true);

		// Generate invite code
		await page.click('button:has-text("Generate Invite Code")');
		await page.waitForTimeout(500);
		await screenshot(page, 'settings-invite-code', true);

		console.log('\n✓ All screenshots captured successfully!');
		console.log(`  Output directory: ${SCREENSHOT_DIR}`);
	} catch (error) {
		console.error('\nError capturing screenshots:', error);
		throw error;
	} finally {
		await browser.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
