<script lang="ts">
	import { calculateProgress } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';

	type Target = {
		id: string;
		name: string;
		target_amount: number;
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

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<span class="font-medium text-gray-900">{target.name}</span>
		<span class="text-sm text-gray-500">
			{formatMoney(currentBalance, currency)} / {formatMoney(target.target_amount, currency)}
		</span>
	</div>
	<div class="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
		<div
			class="h-full rounded-full transition-all duration-500"
			style="width: {progress}%; background-color: {color}"
		></div>
	</div>
	<div class="flex items-center justify-between text-sm">
		<span class="text-gray-500">{Math.round(progress)}% complete</span>
		{#if remaining > 0}
			<span class="text-gray-500">{formatMoney(remaining, currency)} to go</span>
		{:else}
			<span class="font-medium" style="color: {color}">Goal reached!</span>
		{/if}
	</div>
</div>
