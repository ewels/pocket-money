import type { D1Database } from '@cloudflare/workers-types';
import { getSettings } from './db';

export type WebhookEventType =
	| 'transaction.created'
	| 'recurring_payment.processed'
	| 'balance.updated'
	| 'child.created'
	| 'child.updated'
	| 'child.deleted';

export interface WebhookPayload {
	event: WebhookEventType;
	timestamp: number;
	family_id: string;
	data: Record<string, unknown>;
}

export async function sendWebhook(
	db: D1Database,
	familyId: string,
	event: WebhookEventType,
	data: Record<string, unknown>
): Promise<void> {
	const settings = await getSettings(db, familyId);

	if (!settings.webhook_url) {
		return;
	}

	const payload: WebhookPayload = {
		event,
		timestamp: Math.floor(Date.now() / 1000),
		family_id: familyId,
		data
	};

	try {
		await fetch(settings.webhook_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'PocketMoney/1.0'
			},
			body: JSON.stringify(payload)
		});
	} catch {
		// Silently ignore webhook failures to not affect user experience
		// In production, you might want to log these failures
	}
}
