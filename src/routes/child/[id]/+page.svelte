<script lang="ts">
	import { enhance } from '$app/forms';
	import { getInitials, colorHexMap, type ChildColor } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';
	import LineChart from '$lib/components/LineChart.svelte';
	import SavingTarget from '$lib/components/SavingTarget.svelte';
	import TransactionItem from '$lib/components/TransactionItem.svelte';

	let { data } = $props();

	let showAddMoney = $state(false);
	let showWithdraw = $state(false);
	let loading = $state(false);

	const color = data.child.color as ChildColor;
	const colorHex = colorHexMap[color] ?? colorHexMap.blue;
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/" class="text-gray-500 hover:text-gray-700">
				<svg
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
					/>
				</svg>
			</a>
			{#if data.child.photo_data}
				<img
					src={data.child.photo_data}
					alt={data.child.name}
					class="h-16 w-16 rounded-full object-cover ring-4"
					style="--tw-ring-color: {colorHex}40"
				/>
			{:else}
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white bg-child-{data
						.child.color}"
				>
					{getInitials(data.child.name)}
				</div>
			{/if}
			<div>
				<h1 class="text-2xl font-bold text-gray-900">{data.child.name}</h1>
				<p class="text-3xl font-bold text-child-{data.child.color}">
					{formatMoney(data.balance, data.settings?.currency ?? 'EUR')}
				</p>
			</div>
		</div>
		<a href="/child/{data.child.id}/config" class="btn-secondary">
			<svg
				class="mr-2 h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
				/>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Settings
		</a>
	</div>

	<!-- Action buttons -->
	<div class="flex gap-3">
		<button type="button" class="btn-success flex-1" onclick={() => (showAddMoney = true)}>
			<svg
				class="mr-2 h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Money
		</button>
		<button type="button" class="btn-danger flex-1" onclick={() => (showWithdraw = true)}>
			<svg
				class="mr-2 h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
			</svg>
			Withdraw
		</button>
	</div>

	<!-- Saving Targets -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Saving Targets</h2>
		{#if data.targets.length > 0}
			{@const targetsWithAvailableBalance = data.targets.reduce(
				(acc, target) => {
					const availableBalance = Math.max(0, data.balance - acc.usedBalance);
					acc.targets.push({ target, availableBalance });
					acc.usedBalance += target.target_amount;
					return acc;
				},
				{
					targets: [] as Array<{ target: (typeof data.targets)[0]; availableBalance: number }>,
					usedBalance: 0
				}
			).targets}
			<div class="space-y-4">
				{#each targetsWithAvailableBalance as { target, availableBalance } (target.id)}
					<SavingTarget
						{target}
						currentBalance={availableBalance}
						color={colorHex}
						currency={data.settings?.currency ?? 'EUR'}
					/>
				{/each}
			</div>
		{:else}
			<div class="text-center py-6">
				<p class="text-gray-500 mb-4">No saving targets yet</p>
				<a href="/child/{data.child.id}/config" class="btn-primary"> Add Saving Target </a>
			</div>
		{/if}
	</div>

	<!-- Balance History Chart -->
	{#if data.balanceHistory.length > 0}
		<div class="card p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Balance History</h2>
			<div class="h-48">
				<LineChart
					data={data.balanceHistory}
					color={colorHex}
					currency={data.settings?.currency ?? 'EUR'}
				/>
			</div>
		</div>
	{/if}

	<!-- Recurring Payments -->
	{#if data.recurringRules.length > 0}
		<div class="card p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Recurring Payments</h2>
			<div class="space-y-2">
				{#each data.recurringRules as rule (rule.id)}
					<div
						class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
					>
						<div>
							<p class="font-medium text-gray-900">
								{formatMoney(rule.amount, data.settings?.currency ?? 'EUR')}
								{#if rule.description}
									<span class="text-gray-500 font-normal">- {rule.description}</span>
								{/if}
							</p>
							<p class="text-sm text-gray-500">
								Every {rule.interval_days} day{rule.interval_days !== 1 ? 's' : ''}
								{#if !rule.active}
									<span class="text-orange-500">(paused)</span>
								{:else if rule.skip_next}
									<span class="text-orange-500">(skipping next)</span>
								{/if}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Transaction History -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
		{#if data.transactions.length === 0}
			<p class="text-center text-gray-500 py-4">No transactions yet</p>
		{:else}
			<div class="space-y-2">
				{#each data.transactions as transaction (transaction.id)}
					<TransactionItem {transaction} currency={data.settings?.currency ?? 'EUR'} />
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Money Modal -->
{#if showAddMoney}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<button
				type="button"
				class="fixed inset-0 bg-black/50"
				onclick={() => (showAddMoney = false)}
				aria-label="Close"
			></button>
			<div class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<h2 class="text-lg font-semibold text-gray-900">Add Money</h2>
				<form
					method="POST"
					action="?/addMoney"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') showAddMoney = false;
							await update();
						};
					}}
					class="mt-4 space-y-4"
				>
					<div>
						<label for="addAmount" class="label">Amount</label>
						<input
							id="addAmount"
							name="amount"
							type="number"
							step="0.01"
							min="0.01"
							required
							class="input"
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="addDescription" class="label">Description (optional)</label>
						<input
							id="addDescription"
							name="description"
							type="text"
							class="input"
							placeholder="Birthday money, chores, etc."
						/>
					</div>
					<div class="flex justify-end gap-3 pt-4">
						<button type="button" class="btn-secondary" onclick={() => (showAddMoney = false)}
							>Cancel</button
						>
						<button type="submit" class="btn-success" disabled={loading}>
							{loading ? 'Adding...' : 'Add Money'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Withdraw Modal -->
{#if showWithdraw}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<button
				type="button"
				class="fixed inset-0 bg-black/50"
				onclick={() => (showWithdraw = false)}
				aria-label="Close"
			></button>
			<div class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<h2 class="text-lg font-semibold text-gray-900">Withdraw Money</h2>
				<form
					method="POST"
					action="?/withdraw"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') showWithdraw = false;
							await update();
						};
					}}
					class="mt-4 space-y-4"
				>
					<div>
						<label for="withdrawAmount" class="label">Amount</label>
						<input
							id="withdrawAmount"
							name="amount"
							type="number"
							step="0.01"
							min="0.01"
							max={data.balance}
							required
							class="input"
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="withdrawDescription" class="label">Description (optional)</label>
						<input
							id="withdrawDescription"
							name="description"
							type="text"
							class="input"
							placeholder="Toy, game, etc."
						/>
					</div>
					<div class="flex justify-end gap-3 pt-4">
						<button type="button" class="btn-secondary" onclick={() => (showWithdraw = false)}
							>Cancel</button
						>
						<button type="submit" class="btn-danger" disabled={loading}>
							{loading ? 'Withdrawing...' : 'Withdraw'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
