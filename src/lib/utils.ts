export const childColors = [
	'red',
	'orange',
	'yellow',
	'lime',
	'green',
	'teal',
	'cyan',
	'blue',
	'indigo',
	'purple',
	'pink',
	'rose'
] as const;

export type ChildColor = (typeof childColors)[number];

export const colorHexMap: Record<ChildColor, string> = {
	red: '#ef4444',
	orange: '#f97316',
	yellow: '#eab308',
	lime: '#84cc16',
	green: '#22c55e',
	teal: '#14b8a6',
	cyan: '#06b6d4',
	blue: '#3b82f6',
	indigo: '#6366f1',
	purple: '#a855f7',
	pink: '#ec4899',
	rose: '#f43f5e'
};

export function getInitials(name: string): string {
	return name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

export function formatDate(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatRelativeTime(timestamp: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - timestamp;

	if (diff < 60) return 'just now';
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

	return formatDate(timestamp);
}

export function calculateProgress(current: number, target: number): number {
	if (target <= 0) return 0;
	return Math.min(100, Math.max(0, (current / target) * 100));
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type IntervalType = 'daily' | 'weekly' | 'monthly' | 'days';

export function formatInterval(
	intervalType: IntervalType,
	intervalDays: number,
	dayOfWeek: number | null,
	dayOfMonth: number | null
): string {
	switch (intervalType) {
		case 'daily':
			return 'Daily';
		case 'weekly':
			return `Weekly on ${dayNames[dayOfWeek ?? 1]}`;
		case 'monthly': {
			const day = dayOfMonth ?? 1;
			const suffix =
				day === 1 || day === 21 || day === 31
					? 'st'
					: day === 2 || day === 22
						? 'nd'
						: day === 3 || day === 23
							? 'rd'
							: 'th';
			return `Monthly on the ${day}${suffix}`;
		}
		case 'days':
		default:
			return `Every ${intervalDays} day${intervalDays !== 1 ? 's' : ''}`;
	}
}
