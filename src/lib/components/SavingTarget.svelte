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
		currency,
		monthlyIncome = 0
	}: {
		target: Target;
		currentBalance: number;
		color: string;
		currency: string;
		monthlyIncome?: number;
	} = $props();

	const progress = $derived(calculateProgress(currentBalance, target.target_amount));
	const remaining = $derived(Math.max(0, target.target_amount - currentBalance));

	function calculateTimeToTarget(
		current: number,
		targetAmount: number,
		income: number
	): string | null {
		if (current >= targetAmount) return null;
		if (income <= 0) return null;

		const remainingAmount = targetAmount - current;
		const months = remainingAmount / income;

		if (months < 1) {
			const weeks = Math.ceil(months * 4);
			return `~${weeks} week${weeks !== 1 ? 's' : ''}`;
		}
		if (months < 12) {
			const roundedMonths = Math.ceil(months);
			return `~${roundedMonths} month${roundedMonths !== 1 ? 's' : ''}`;
		}
		const years = months / 12;
		return `~${years.toFixed(1)} years`;
	}

	const timeToTarget = $derived(
		calculateTimeToTarget(currentBalance, target.target_amount, monthlyIncome)
	);
</script>

<div class="flex gap-4">
	{#if target.photo_data}
		<img
			src={target.photo_data}
			alt={target.name}
			class="w-16 h-16 rounded-lg object-cover shrink-0"
		/>
	{/if}
	<div class="flex-1 min-w-0 space-y-2">
		<!-- Mobile layout -->
		<div class="sm:hidden">
			<div class="flex items-baseline justify-between gap-2">
				<div class="min-w-0">
					{#if target.link}
						<a
							href={target.link}
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-gray-900 hover:underline truncate block"
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
						<span class="font-medium text-gray-900 truncate block">{target.name}</span>
					{/if}
				</div>
				<span class="text-sm text-gray-500 whitespace-nowrap">
					{formatMoney(Math.min(currentBalance, target.target_amount), currency)} / {formatMoney(
						target.target_amount,
						currency
					)}
				</span>
			</div>
		</div>

		<!-- Desktop layout: name [gap] amount [big gap] percentage · remaining · time -->
		<div class="hidden sm:flex sm:items-baseline sm:gap-2">
			<div class="min-w-0 shrink-0">
				{#if target.link}
					<a
						href={target.link}
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-gray-900 hover:underline"
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
					<span class="font-medium text-gray-900">{target.name}</span>
				{/if}
			</div>
			<span class="text-sm text-gray-500 whitespace-nowrap">
				{formatMoney(Math.min(currentBalance, target.target_amount), currency)} / {formatMoney(
					target.target_amount,
					currency
				)}
			</span>
			<div class="flex-1"></div>
			<span class="text-sm text-gray-500 whitespace-nowrap">
				{#if remaining > 0}
					{Math.round(progress)}%
					<span class="text-gray-400 mx-1">·</span>
					{formatMoney(remaining, currency)} to go
					{#if timeToTarget}
						<span class="text-gray-400 mx-1">·</span>
						{timeToTarget} to reach goal
					{/if}
				{:else}
					<span class="font-medium" style="color: {color}">Goal reached!</span>
				{/if}
			</span>
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
		<!-- Time to target on mobile only -->
		{#if timeToTarget}
			<p class="text-xs text-gray-500 sm:hidden">{timeToTarget} to reach goal</p>
		{/if}
	</div>
</div>
