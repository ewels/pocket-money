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

async function signPayload(payload: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
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

	const body = JSON.stringify(payload);
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'User-Agent': 'PocketMoney/1.0'
	};

	if (settings.webhook_secret) {
		const signature = await signPayload(body, settings.webhook_secret);
		headers['X-Webhook-Signature'] = `sha256=${signature}`;
	}

	try {
		await fetch(settings.webhook_url, {
			method: 'POST',
			headers,
			body
		});
	} catch {
		// Silently ignore webhook failures to not affect user experience
	}
}
