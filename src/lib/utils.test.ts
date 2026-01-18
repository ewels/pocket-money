import { describe, it, expect } from 'vitest';
import {
	getInitials,
	formatDate,
	formatRelativeTime,
	calculateProgress,
	formatInterval
} from './utils';

describe('getInitials', () => {
	it('should return initials for a single word', () => {
		expect(getInitials('John')).toBe('J');
	});

	it('should return initials for multiple words', () => {
		expect(getInitials('John Doe')).toBe('JD');
	});

	it('should limit to 2 characters', () => {
		expect(getInitials('John Paul Jones')).toBe('JP');
	});

	it('should uppercase the initials', () => {
		expect(getInitials('john doe')).toBe('JD');
	});
});

describe('formatDate', () => {
	it('should format a Unix timestamp', () => {
		// January 15, 2024
		const timestamp = 1705312800;
		const formatted = formatDate(timestamp);
		// The exact format depends on locale, but it should contain the date
		expect(formatted).toMatch(/2024/);
		expect(formatted).toMatch(/15/);
	});
});

describe('formatRelativeTime', () => {
	it('should return "just now" for recent timestamps', () => {
		const now = Math.floor(Date.now() / 1000);
		expect(formatRelativeTime(now - 30)).toBe('just now');
	});

	it('should return minutes ago for timestamps less than an hour old', () => {
		const now = Math.floor(Date.now() / 1000);
		expect(formatRelativeTime(now - 120)).toBe('2m ago');
	});

	it('should return hours ago for timestamps less than a day old', () => {
		const now = Math.floor(Date.now() / 1000);
		expect(formatRelativeTime(now - 7200)).toBe('2h ago');
	});

	it('should return days ago for timestamps less than a week old', () => {
		const now = Math.floor(Date.now() / 1000);
		expect(formatRelativeTime(now - 172800)).toBe('2d ago');
	});
});

describe('calculateProgress', () => {
	it('should return 0 for target <= 0', () => {
		expect(calculateProgress(50, 0)).toBe(0);
		expect(calculateProgress(50, -10)).toBe(0);
	});

	it('should calculate correct percentage', () => {
		expect(calculateProgress(25, 100)).toBe(25);
		expect(calculateProgress(50, 100)).toBe(50);
		expect(calculateProgress(75, 100)).toBe(75);
	});

	it('should cap at 100%', () => {
		expect(calculateProgress(150, 100)).toBe(100);
	});

	it('should not go below 0%', () => {
		expect(calculateProgress(-50, 100)).toBe(0);
	});
});

describe('formatInterval', () => {
	it('should format daily intervals', () => {
		expect(formatInterval('daily', 1, null, null)).toBe('Daily');
	});

	it('should format weekly intervals with day of week', () => {
		expect(formatInterval('weekly', 7, 0, null)).toBe('Weekly on Sunday');
		expect(formatInterval('weekly', 7, 1, null)).toBe('Weekly on Monday');
		expect(formatInterval('weekly', 7, 5, null)).toBe('Weekly on Friday');
	});

	it('should default to Monday for weekly without day specified', () => {
		expect(formatInterval('weekly', 7, null, null)).toBe('Weekly on Monday');
	});

	it('should format monthly intervals with ordinal suffixes', () => {
		expect(formatInterval('monthly', 30, null, 1)).toBe('Monthly on the 1st');
		expect(formatInterval('monthly', 30, null, 2)).toBe('Monthly on the 2nd');
		expect(formatInterval('monthly', 30, null, 3)).toBe('Monthly on the 3rd');
		expect(formatInterval('monthly', 30, null, 4)).toBe('Monthly on the 4th');
		expect(formatInterval('monthly', 30, null, 11)).toBe('Monthly on the 11th');
		expect(formatInterval('monthly', 30, null, 21)).toBe('Monthly on the 21st');
		expect(formatInterval('monthly', 30, null, 22)).toBe('Monthly on the 22nd');
		expect(formatInterval('monthly', 30, null, 23)).toBe('Monthly on the 23rd');
		expect(formatInterval('monthly', 30, null, 31)).toBe('Monthly on the 31st');
	});

	it('should default to 1st for monthly without day specified', () => {
		expect(formatInterval('monthly', 30, null, null)).toBe('Monthly on the 1st');
	});

	it('should format custom day intervals', () => {
		expect(formatInterval('days', 1, null, null)).toBe('Every 1 day');
		expect(formatInterval('days', 7, null, null)).toBe('Every 7 days');
		expect(formatInterval('days', 14, null, null)).toBe('Every 14 days');
	});
});
