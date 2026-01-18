import { describe, it, expect } from 'vitest';
import { currencies, getCurrencySymbol, formatMoney } from './currencies';

describe('currencies', () => {
	it('should have 12 currencies defined', () => {
		expect(currencies).toHaveLength(12);
	});

	it('should have EUR as the first currency', () => {
		expect(currencies[0].code).toBe('EUR');
	});

	it('should have unique currency codes', () => {
		const codes = currencies.map((c) => c.code);
		const uniqueCodes = new Set(codes);
		expect(uniqueCodes.size).toBe(codes.length);
	});
});

describe('getCurrencySymbol', () => {
	it('should return € for EUR', () => {
		expect(getCurrencySymbol('EUR')).toBe('€');
	});

	it('should return £ for GBP', () => {
		expect(getCurrencySymbol('GBP')).toBe('£');
	});

	it('should return $ for USD', () => {
		expect(getCurrencySymbol('USD')).toBe('$');
	});

	it('should return the code itself for unknown currencies', () => {
		expect(getCurrencySymbol('XYZ')).toBe('XYZ');
	});
});

describe('formatMoney', () => {
	it('should format positive amounts correctly', () => {
		expect(formatMoney(10, 'EUR')).toBe('€10.00');
		expect(formatMoney(100.5, 'GBP')).toBe('£100.50');
		expect(formatMoney(1234.56, 'USD')).toBe('$1234.56');
	});

	it('should format negative amounts with a minus sign', () => {
		expect(formatMoney(-10, 'EUR')).toBe('-€10.00');
		expect(formatMoney(-100.5, 'GBP')).toBe('-£100.50');
	});

	it('should format zero correctly', () => {
		expect(formatMoney(0, 'EUR')).toBe('€0.00');
	});

	it('should round to 2 decimal places', () => {
		expect(formatMoney(10.999, 'EUR')).toBe('€11.00');
		expect(formatMoney(10.001, 'EUR')).toBe('€10.00');
	});

	it('should handle unknown currency codes', () => {
		expect(formatMoney(10, 'XYZ')).toBe('XYZ10.00');
	});
});
