import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, hashPin, verifyPin } from './auth';

describe('hashPassword', () => {
	it('should hash a password', async () => {
		const password = 'testpassword123';
		const hash = await hashPassword(password);

		expect(hash).toBeDefined();
		expect(hash).not.toBe(password);
		expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
	});

	it('should produce different hashes for the same password', async () => {
		const password = 'testpassword123';
		const hash1 = await hashPassword(password);
		const hash2 = await hashPassword(password);

		expect(hash1).not.toBe(hash2);
	});
});

describe('verifyPassword', () => {
	it('should verify a correct password', async () => {
		const password = 'testpassword123';
		const hash = await hashPassword(password);

		const result = await verifyPassword(password, hash);
		expect(result).toBe(true);
	});

	it('should reject an incorrect password', async () => {
		const password = 'testpassword123';
		const hash = await hashPassword(password);

		const result = await verifyPassword('wrongpassword', hash);
		expect(result).toBe(false);
	});

	it('should be case sensitive', async () => {
		const password = 'TestPassword123';
		const hash = await hashPassword(password);

		const result = await verifyPassword('testpassword123', hash);
		expect(result).toBe(false);
	});
});

describe('hashPin', () => {
	it('should hash a PIN', async () => {
		const pin = '1234';
		const hash = await hashPin(pin);

		expect(hash).toBeDefined();
		expect(hash).not.toBe(pin);
		expect(hash.startsWith('$2')).toBe(true);
	});

	it('should work with 4-6 digit PINs', async () => {
		const pins = ['1234', '12345', '123456'];

		for (const pin of pins) {
			const hash = await hashPin(pin);
			expect(hash).toBeDefined();
		}
	});
});

describe('verifyPin', () => {
	it('should verify a correct PIN', async () => {
		const pin = '1234';
		const hash = await hashPin(pin);

		const result = await verifyPin(pin, hash);
		expect(result).toBe(true);
	});

	it('should reject an incorrect PIN', async () => {
		const pin = '1234';
		const hash = await hashPin(pin);

		const result = await verifyPin('5678', hash);
		expect(result).toBe(false);
	});

	it('should reject PINs with extra digits', async () => {
		const pin = '1234';
		const hash = await hashPin(pin);

		const result = await verifyPin('12345', hash);
		expect(result).toBe(false);
	});
});
