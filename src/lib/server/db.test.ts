import { describe, it, expect } from 'vitest';
import { generateId, generateInviteCodeString } from './db';

describe('generateId', () => {
	it('should generate a valid UUID', () => {
		const id = generateId();

		expect(id).toBeDefined();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	});

	it('should generate unique IDs', () => {
		const ids = new Set<string>();
		for (let i = 0; i < 100; i++) {
			ids.add(generateId());
		}
		expect(ids.size).toBe(100);
	});
});

describe('generateInviteCodeString', () => {
	it('should generate an 8 character code', () => {
		const code = generateInviteCodeString();

		expect(code).toBeDefined();
		expect(code).toHaveLength(8);
	});

	it('should only contain allowed characters', () => {
		const allowedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

		for (let i = 0; i < 100; i++) {
			const code = generateInviteCodeString();
			for (const char of code) {
				expect(allowedChars).toContain(char);
			}
		}
	});

	it('should not contain ambiguous characters', () => {
		const ambiguousChars = ['0', 'O', '1', 'I', 'L'];

		for (let i = 0; i < 100; i++) {
			const code = generateInviteCodeString();
			for (const char of ambiguousChars) {
				expect(code).not.toContain(char);
			}
		}
	});

	it('should generate unique codes', () => {
		const codes = new Set<string>();
		for (let i = 0; i < 100; i++) {
			codes.add(generateInviteCodeString());
		}
		// With 8 chars from 32 possible, collisions in 100 codes are very unlikely
		expect(codes.size).toBe(100);
	});
});
