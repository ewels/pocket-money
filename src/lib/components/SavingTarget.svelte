<script lang="ts">
	import { calculateProgress } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';

	type Target = {
		id: string;
		name: string;
		target_amount: number;
		photo_data?: string | null;
		description?: string | null;
		link?: string | null;
	};

	let {
		target,
		currentBalance,
		color,
		currency
	}: { target: Target; currentBalance: number; color: string; currency: string } = $props();

	const progress = $derived(calculateProgress(currentBalance, target.target_amount));
	const remaining = $derived(Math.max(0, target.target_amount - currentBalance));
</script>

<div class="flex gap-4">
	{#if target.photo_data}
		<img
			src={target.photo_data}
			alt={target.name}
			class="w-16 h-16 rounded-lg object-cover shrink-0"
		/>
	{/if}
	<div class="flex-1 space-y-2">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-baseline gap-2 min-w-0">
				{#if target.link}
					<a
						href={target.link}
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-gray-900 hover:underline truncate"
					>
						{target.name}
						<svg
							class="inline-block w-3 h-3 ml-1 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
							/>
						</svg>
					</a>
				{:else}
					<span class="font-medium text-gray-900 truncate">{target.name}</span>
				{/if}
				<span class="text-sm text-gray-500 whitespace-nowrap">
					{formatMoney(Math.min(currentBalance, target.target_amount), currency)} / {formatMoney(
						target.target_amount,
						currency
					)}
				</span>
			</div>
			<div class="text-sm text-gray-500 whitespace-nowrap text-right">
				{#if remaining > 0}
					<span>{Math.round(progress)}%</span>
					<span class="text-gray-400 mx-1">·</span>
					<span>{formatMoney(remaining, currency)} to go</span>
				{:else}
					<span class="font-medium" style="color: {color}">Goal reached!</span>
				{/if}
			</div>
		</div>
		{#if target.description}
			<p class="text-sm text-gray-500">{target.description}</p>
		{/if}
		<div class="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
			<div
				class="h-full rounded-full transition-all duration-500"
				style="width: {progress}%; background-color: {color}"
			></div>
		</div>
	</div>
</div>
