import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	generateId,
	generateInviteCodeString,
	localTimeToUtc,
	getDayOfWeekInTimezone,
	getDatePartsInTimezone,
	calculateNextRun,
	calculateNextRunFromCurrent
} from './db';

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

describe('localTimeToUtc', () => {
	it('should return correct UTC timestamp for UTC timezone', () => {
		// 2025-01-15 at 10:00 UTC
		const result = localTimeToUtc(2025, 0, 15, 10, 'UTC');
		const expected = Date.UTC(2025, 0, 15, 10) / 1000;
		expect(result).toBe(expected);
	});

	it('should handle positive offset timezone (Asia/Tokyo = UTC+9)', () => {
		// 2025-01-15 at 10:00 JST = 01:00 UTC
		const result = localTimeToUtc(2025, 0, 15, 10, 'Asia/Tokyo');
		const expected = Date.UTC(2025, 0, 15, 1) / 1000;
		expect(result).toBe(expected);
	});

	it('should handle negative offset timezone (America/New_York winter = UTC-5)', () => {
		// 2025-01-15 at 10:00 EST = 15:00 UTC
		const result = localTimeToUtc(2025, 0, 15, 10, 'America/New_York');
		const expected = Date.UTC(2025, 0, 15, 15) / 1000;
		expect(result).toBe(expected);
	});

	it('should handle DST summer offset (America/New_York summer = UTC-4)', () => {
		// 2025-07-15 at 10:00 EDT = 14:00 UTC
		const result = localTimeToUtc(2025, 6, 15, 10, 'America/New_York');
		const expected = Date.UTC(2025, 6, 15, 14) / 1000;
		expect(result).toBe(expected);
	});

	it('should handle DST spring-forward gap gracefully', () => {
		// In America/New_York, 2025-03-09 at 2:00 AM doesn't exist (clocks jump to 3:00 AM)
		const result = localTimeToUtc(2025, 2, 9, 2, 'America/New_York');
		// Should clamp to 3:00 AM EDT = 07:00 UTC
		const expected = Date.UTC(2025, 2, 9, 7) / 1000;
		expect(result).toBe(expected);
	});
});

describe('getDayOfWeekInTimezone', () => {
	it('should return correct day of week in UTC', () => {
		// 2025-01-15 is a Wednesday (day 3)
		const date = new Date(Date.UTC(2025, 0, 15, 12, 0, 0));
		expect(getDayOfWeekInTimezone(date, 'UTC')).toBe(3);
	});

	it('should return different day across timezone boundary at midnight', () => {
		// 2025-01-15 at 23:30 UTC = 2025-01-16 08:30 in Asia/Tokyo
		const date = new Date(Date.UTC(2025, 0, 15, 23, 30, 0));
		// UTC: Wednesday (3), Tokyo: Thursday (4)
		expect(getDayOfWeekInTimezone(date, 'UTC')).toBe(3);
		expect(getDayOfWeekInTimezone(date, 'Asia/Tokyo')).toBe(4);
	});
});

describe('getDatePartsInTimezone', () => {
	it('should return correct date parts in UTC', () => {
		const date = new Date(Date.UTC(2025, 6, 15, 10, 0, 0));
		const parts = getDatePartsInTimezone(date, 'UTC');
		expect(parts).toEqual({ year: 2025, month: 6, day: 15, hour: 10 });
	});

	it('should return date parts shifted across timezone boundary', () => {
		// 2025-01-15 at 23:00 UTC = 2025-01-16 08:00 in Asia/Tokyo
		const date = new Date(Date.UTC(2025, 0, 15, 23, 0, 0));
		const parts = getDatePartsInTimezone(date, 'Asia/Tokyo');
		expect(parts).toEqual({ year: 2025, month: 0, day: 16, hour: 8 });
	});
});

describe('calculateNextRun', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('should schedule daily run for tomorrow at specified time', () => {
		// Pin "now" to 2025-01-15 12:00 UTC
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 12, 0, 0)));

		const result = calculateNextRun('daily', 1, null, null, 7, 'UTC');
		// Should be 2025-01-16 at 07:00 UTC
		const expected = Date.UTC(2025, 0, 16, 7) / 1000;
		expect(result).toBe(expected);
	});

	it('should schedule weekly run on correct day', () => {
		// Pin "now" to 2025-01-15 12:00 UTC (Wednesday)
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 12, 0, 0)));

		// Schedule for Friday (day 5)
		const result = calculateNextRun('weekly', 7, 5, null, 9, 'UTC');
		// Should be 2025-01-17 at 09:00 UTC (Friday)
		const expected = Date.UTC(2025, 0, 17, 9) / 1000;
		expect(result).toBe(expected);
	});

	it('should schedule monthly run on correct day', () => {
		// Pin "now" to 2025-01-15 12:00 UTC
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 12, 0, 0)));

		const result = calculateNextRun('monthly', 30, null, 1, 8, 'UTC');
		// Should be 2025-02-01 at 08:00 UTC
		const expected = Date.UTC(2025, 1, 1, 8) / 1000;
		expect(result).toBe(expected);
	});

	it('should schedule days-interval run correctly', () => {
		// Pin "now" to 2025-01-15 12:00 UTC
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 12, 0, 0)));

		const result = calculateNextRun('days', 3, null, null, 10, 'UTC');
		// Should be 2025-01-18 at 10:00 UTC
		const expected = Date.UTC(2025, 0, 18, 10) / 1000;
		expect(result).toBe(expected);
	});

	it('should account for timezone offset when scheduling', () => {
		// Pin "now" to 2025-01-15 12:00 UTC (= 21:00 JST)
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 12, 0, 0)));

		// Daily at 7:00 JST = 22:00 UTC the previous day
		const result = calculateNextRun('daily', 1, null, null, 7, 'Asia/Tokyo');
		// Tomorrow in JST is Jan 16, 7:00 JST = Jan 15 22:00 UTC
		const expected = Date.UTC(2025, 0, 15, 22) / 1000;
		expect(result).toBe(expected);
	});
});

describe('calculateNextRunFromCurrent', () => {
	it('should advance daily by one day', () => {
		// Current next_run is 2025-01-15 07:00 UTC
		const current = Date.UTC(2025, 0, 15, 7) / 1000;
		const result = calculateNextRunFromCurrent(current, 'daily', 1, null, null, 7, 'UTC');
		const expected = Date.UTC(2025, 0, 16, 7) / 1000;
		expect(result).toBe(expected);
	});

	it('should advance weekly by seven days', () => {
		const current = Date.UTC(2025, 0, 15, 9) / 1000;
		const result = calculateNextRunFromCurrent(current, 'weekly', 7, null, null, 9, 'UTC');
		const expected = Date.UTC(2025, 0, 22, 9) / 1000;
		expect(result).toBe(expected);
	});

	it('should advance monthly to next month', () => {
		const current = Date.UTC(2025, 0, 15, 8) / 1000;
		const result = calculateNextRunFromCurrent(current, 'monthly', 30, null, 15, 8, 'UTC');
		const expected = Date.UTC(2025, 1, 15, 8) / 1000;
		expect(result).toBe(expected);
	});

	it('should advance days-interval correctly', () => {
		const current = Date.UTC(2025, 0, 15, 10) / 1000;
		const result = calculateNextRunFromCurrent(current, 'days', 5, null, null, 10, 'UTC');
		const expected = Date.UTC(2025, 0, 20, 10) / 1000;
		expect(result).toBe(expected);
	});

	it('should handle month boundary (Jan 31 -> Feb 28)', () => {
		const current = Date.UTC(2025, 0, 31, 8) / 1000;
		const result = calculateNextRunFromCurrent(current, 'monthly', 30, null, 31, 8, 'UTC');
		// Feb has 28 days in 2025, should clamp to 28
		const expected = Date.UTC(2025, 1, 28, 8) / 1000;
		expect(result).toBe(expected);
	});
});
