<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { getInitials, colorHexMap, type ChildColor } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';
	import LineChart from '$lib/components/LineChart.svelte';
	import SavingTarget from '$lib/components/SavingTarget.svelte';
	import TransactionItem from '$lib/components/TransactionItem.svelte';
	import AddTargetModal from '$lib/components/AddTargetModal.svelte';

	let { data } = $props();

	let showAddMoney = $state(false);
	let showWithdraw = $state(false);
	let showAddTarget = $state(false);
	let showDeductions = $state(false);
	let loading = $state(false);

	const color = data.child.color as ChildColor;
	const colorHex = colorHexMap[color] ?? colorHexMap.blue;

	// Date range options for balance history
	const historyRanges = [
		{ days: 7, label: '1W' },
		{ days: 30, label: '1M' },
		{ days: 180, label: '6M' },
		{ days: 0, label: 'All' }
	];

	function setHistoryRange(days: number) {
		const url = new URL(window.location.href);
		if (days === 30) {
			url.searchParams.delete('historyDays');
		} else {
			url.searchParams.set('historyDays', days.toString());
		}
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}
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
		<button
			type="button"
			class="btn-warning flex-1 relative"
			onclick={() => (showDeductions = true)}
		>
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
					d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Deduct
			{#if data.totalDeductions > 0}
				<span
					class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
				>
					{data.deductions.length}
				</span>
			{/if}
		</button>
	</div>

	<!-- Pending Deductions Card -->
	{#if data.totalDeductions > 0}
		<div class="card p-4 border-orange-200 bg-orange-50">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-orange-800">Pending Deductions</h3>
					<p class="text-lg font-bold text-orange-600">
						{formatMoney(data.totalDeductions, data.settings?.currency ?? 'EUR')}
					</p>
					<p class="text-xs text-orange-600">
						Will reduce the next {data.deductions.length === 1 ? 'payment' : 'payments'}
					</p>
				</div>
				<button
					type="button"
					class="text-orange-600 hover:text-orange-800"
					onclick={() => (showDeductions = true)}
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Saving Targets -->
	<div class="card p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900">Saving Targets</h2>
			{#if data.targets.length > 0}
				<button type="button" class="btn-primary text-sm" onclick={() => (showAddTarget = true)}>
					Add Target
				</button>
			{/if}
		</div>
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
				<button type="button" class="btn-primary" onclick={() => (showAddTarget = true)}>
					Add Saving Target
				</button>
			</div>
		{/if}
	</div>

	<!-- Balance History Chart -->
	{#if data.balanceHistory.length > 0}
		<div class="card p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900">Balance History</h2>
				<div class="flex gap-1">
					{#each historyRanges as range (range.days)}
						<button
							type="button"
							class="px-2 py-1 text-xs rounded {data.historyDays === range.days
								? 'bg-blue-100 text-blue-700 font-medium'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
							onclick={() => setHistoryRange(range.days)}
						>
							{range.label}
						</button>
					{/each}
				</div>
			</div>
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

<!-- Add Target Modal -->
<AddTargetModal bind:open={showAddTarget} />

<!-- Deductions Modal -->
{#if showDeductions}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<button
				type="button"
				class="fixed inset-0 bg-black/50"
				onclick={() => (showDeductions = false)}
				aria-label="Close"
			></button>
			<div
				class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
			>
				<h2 class="text-lg font-semibold text-gray-900">Manage Deductions</h2>
				<p class="mt-1 text-sm text-gray-500">
					Deductions reduce or skip upcoming recurring payments.
				</p>

				<!-- Existing Deductions -->
				{#if data.deductions.length > 0}
					<div class="mt-4">
						<h3 class="text-sm font-medium text-gray-700 mb-2">Pending Deductions</h3>
						<div class="space-y-2">
							{#each data.deductions as deduction (deduction.id)}
								<div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
									<div>
										<p class="font-medium text-gray-900">
											{formatMoney(deduction.amount, data.settings?.currency ?? 'EUR')}
										</p>
										{#if deduction.description}
											<p class="text-sm text-gray-500">{deduction.description}</p>
										{/if}
									</div>
									<form method="POST" action="?/deleteDeduction" use:enhance>
										<input type="hidden" name="deductionId" value={deduction.id} />
										<button type="submit" class="p-2 text-red-400 hover:text-red-600">
											<svg
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
												/>
											</svg>
										</button>
									</form>
								</div>
							{/each}
						</div>
						<p class="mt-2 text-sm text-gray-500">
							Total: {formatMoney(data.totalDeductions, data.settings?.currency ?? 'EUR')}
						</p>
					</div>
				{/if}

				<!-- Add New Deduction -->
				<div class="mt-6 pt-4 border-t border-gray-200">
					<h3 class="text-sm font-medium text-gray-700 mb-3">Add New Deduction</h3>
					<form
						method="POST"
						action="?/addDeduction"
						use:enhance={() => {
							loading = true;
							return async ({ result, update }) => {
								loading = false;
								if (result.type === 'success') {
									await update();
								} else {
									await update();
								}
							};
						}}
						class="space-y-4"
					>
						<div>
							<label for="deductionAmount" class="label">Amount</label>
							<input
								id="deductionAmount"
								name="amount"
								type="number"
								step="0.01"
								min="0.01"
								required
								class="input"
								placeholder="0.00"
								value={data.nextPaymentAmount > 0 ? data.nextPaymentAmount : ''}
							/>
							{#if data.nextPaymentAmount > 0}
								<p class="mt-1 text-xs text-gray-500">
									Pre-filled with next payment amount ({formatMoney(
										data.nextPaymentAmount,
										data.settings?.currency ?? 'EUR'
									)})
								</p>
							{/if}
						</div>
						<div>
							<label for="deductionDescription" class="label">Reason (optional)</label>
							<input
								id="deductionDescription"
								name="description"
								type="text"
								class="input"
								placeholder="e.g., Didn't do chores"
							/>
						</div>
						<div class="flex justify-end gap-3 pt-2">
							<button type="button" class="btn-secondary" onclick={() => (showDeductions = false)}
								>Close</button
							>
							<button type="submit" class="btn-warning" disabled={loading}>
								{loading ? 'Adding...' : 'Add Deduction'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
