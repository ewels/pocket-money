export const currencies = [
	{ code: 'EUR', symbol: '\u20ac', name: 'Euro' },
	{ code: 'GBP', symbol: '\u00a3', name: 'British Pound' },
	{ code: 'USD', symbol: '$', name: 'US Dollar' },
	{ code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
	{ code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
	{ code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
	{ code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
	{ code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
	{ code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
	{ code: 'JPY', symbol: '\u00a5', name: 'Japanese Yen' },
	{ code: 'PLN', symbol: 'z\u0142', name: 'Polish Zloty' },
	{ code: 'CZK', symbol: 'K\u010d', name: 'Czech Koruna' }
] as const;

export type CurrencyCode = (typeof currencies)[number]['code'];

export function getCurrencySymbol(code: string): string {
	const currency = currencies.find((c) => c.code === code);
	return currency?.symbol ?? code;
}

export function formatMoney(amount: number, currencyCode: string): string {
	const symbol = getCurrencySymbol(currencyCode);
	const formatted = Math.abs(amount).toFixed(2);
	const sign = amount < 0 ? '-' : '';
	return `${sign}${symbol}${formatted}`;
}
