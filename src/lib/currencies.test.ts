import { describe, it, expect } from 'vitest';
import { currencies, getCurrencySymbol, getCurrencyDecimals, formatMoney } from './currencies';

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

describe('getCurrencyDecimals', () => {
	it('should return 2 for EUR, GBP, USD', () => {
		expect(getCurrencyDecimals('EUR')).toBe(2);
		expect(getCurrencyDecimals('GBP')).toBe(2);
		expect(getCurrencyDecimals('USD')).toBe(2);
	});

	it('should return 0 for SEK, NOK, DKK, JPY, CZK', () => {
		expect(getCurrencyDecimals('SEK')).toBe(0);
		expect(getCurrencyDecimals('NOK')).toBe(0);
		expect(getCurrencyDecimals('DKK')).toBe(0);
		expect(getCurrencyDecimals('JPY')).toBe(0);
		expect(getCurrencyDecimals('CZK')).toBe(0);
	});

	it('should return 2 for unknown currencies', () => {
		expect(getCurrencyDecimals('XYZ')).toBe(2);
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

	it('should round to 2 decimal places for EUR/GBP/USD', () => {
		expect(formatMoney(10.999, 'EUR')).toBe('€11.00');
		expect(formatMoney(10.001, 'EUR')).toBe('€10.00');
	});

	it('should format zero-decimal currencies without decimals', () => {
		expect(formatMoney(350, 'SEK')).toBe('kr350');
		expect(formatMoney(0, 'SEK')).toBe('kr0');
		expect(formatMoney(-100, 'SEK')).toBe('-kr100');
		expect(formatMoney(1000, 'JPY')).toBe('¥1000');
		expect(formatMoney(250, 'NOK')).toBe('kr250');
		expect(formatMoney(199, 'CZK')).toBe('Kč199');
	});

	it('should round zero-decimal currencies to whole numbers', () => {
		expect(formatMoney(10.5, 'SEK')).toBe('kr11');
		expect(formatMoney(10.4, 'SEK')).toBe('kr10');
	});

	it('should handle unknown currency codes', () => {
		expect(formatMoney(10, 'XYZ')).toBe('XYZ10.00');
	});
});
