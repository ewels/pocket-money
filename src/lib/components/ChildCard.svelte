<script lang="ts">
	import { getInitials, colorHexMap, calculateProgress, type ChildColor } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';
	import DoughnutChart from './DoughnutChart.svelte';

	type Child = {
		id: string;
		name: string;
		color: string;
		photo_url: string | null;
		photo_data: string | null;
		balance: number;
		targets: Array<{
			id: string;
			name: string;
			target_amount: number;
		}>;
	};

	let { child, currency }: { child: Child; currency: string } = $props();

	const colorClass = $derived(`bg-child-${child.color}` as const);
	const topTarget = $derived(child.targets[0]);
</script>

<a href="/child/{child.id}" class="card hover:shadow-md transition-shadow">
	<div class="p-6">
		<div class="flex items-center gap-4">
			{#if child.photo_data}
				<img
					src={child.photo_data}
					alt={child.name}
					class="h-16 w-16 rounded-full object-cover ring-4 ring-child-{child.color}/20 shrink-0"
				/>
			{:else}
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white shrink-0 {colorClass}"
				>
					{getInitials(child.name)}
				</div>
			{/if}
			<div class="flex-1 min-w-0">
				<h3 class="text-lg font-semibold text-gray-900 truncate">{child.name}</h3>
				<p class="text-2xl font-bold text-child-{child.color}">
					{formatMoney(child.balance, currency)}
				</p>
			</div>
			{#if topTarget}
				<div class="text-center shrink-0">
					<div class="w-12 h-12">
						<DoughnutChart
							progress={calculateProgress(child.balance, topTarget.target_amount)}
							color={colorHexMap[child.color as ChildColor] ?? colorHexMap.blue}
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500 truncate max-w-[48px]" title={topTarget.name}>
						{topTarget.name}
					</p>
				</div>
			{/if}
		</div>
	</div>
</a>
