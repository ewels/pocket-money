export const currencies = [
	{ code: 'EUR', symbol: '\u20ac', name: 'Euro', decimals: 2 },
	{ code: 'GBP', symbol: '\u00a3', name: 'British Pound', decimals: 2 },
	{ code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
	{ code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 0 },
	{ code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 0 },
	{ code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimals: 0 },
	{ code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
	{ code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
	{ code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
	{ code: 'JPY', symbol: '\u00a5', name: 'Japanese Yen', decimals: 0 },
	{ code: 'PLN', symbol: 'z\u0142', name: 'Polish Zloty', decimals: 2 },
	{ code: 'CZK', symbol: 'K\u010d', name: 'Czech Koruna', decimals: 0 }
] as const;

export type CurrencyCode = (typeof currencies)[number]['code'];

export function getCurrencySymbol(code: string): string {
	const currency = currencies.find((c) => c.code === code);
	return currency?.symbol ?? code;
}

export function getCurrencyDecimals(code: string): number {
	const currency = currencies.find((c) => c.code === code);
	return currency?.decimals ?? 2;
}

export function formatMoney(amount: number, currencyCode: string): string {
	const symbol = getCurrencySymbol(currencyCode);
	const decimals = getCurrencyDecimals(currencyCode);
	const formatted = Math.abs(amount).toFixed(decimals);
	const sign = amount < 0 ? '-' : '';
	return `${sign}${symbol}${formatted}`;
}
