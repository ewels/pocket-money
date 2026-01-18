<script lang="ts">
	import { getInitials, formatRelativeTime } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';

	type Transaction = {
		id: string;
		amount: number;
		description: string | null;
		is_recurring: number;
		created_at: number;
		user_name?: string;
		user_photo_url?: string | null;
		user_photo_data?: string | null;
	};

	let { transaction, currency }: { transaction: Transaction; currency: string } = $props();

	const isPositive = $derived(transaction.amount > 0);
</script>

<div class="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
	{#if transaction.user_photo_data}
		<img
			src={transaction.user_photo_data}
			alt={transaction.user_name ?? 'User'}
			class="h-8 w-8 rounded-full object-cover"
		/>
	{:else if transaction.user_name}
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600"
		>
			{getInitials(transaction.user_name)}
		</div>
	{:else if transaction.is_recurring}
		<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
				/>
			</svg>
		</div>
	{:else}
		<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-400">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
				/>
			</svg>
		</div>
	{/if}

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-gray-900 truncate">
				{#if transaction.description}
					{transaction.description}
				{:else if isPositive}
					Money added
				{:else}
					Withdrawal
				{/if}
			</p>
			<p class="text-sm font-semibold {isPositive ? 'text-green-600' : 'text-red-600'}">
				{isPositive ? '+' : ''}{formatMoney(transaction.amount, currency)}
			</p>
		</div>
		<div class="flex items-center gap-2 text-xs text-gray-500">
			<span>{formatRelativeTime(transaction.created_at)}</span>
			{#if transaction.user_name}
				<span>by {transaction.user_name}</span>
			{:else if transaction.is_recurring}
				<span>recurring payment</span>
			{/if}
		</div>
	</div>
</div>
