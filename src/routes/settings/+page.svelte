<script lang="ts">
	import { enhance } from '$app/forms';
	import { currencies } from '$lib/currencies';

	let { data, form } = $props();

	let loading = $state(false);
	let showPinModal = $state(false);
	let pinAction = $state<'enable' | 'change' | 'disable'>('enable');
	let copiedCode = $state(false);
	let webhookLoading = $state(false);

	function copyInviteCode(code: string) {
		navigator.clipboard.writeText(code);
		copiedCode = true;
		setTimeout(() => (copiedCode = false), 2000);
	}

	function formatExpiry(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Get active invite code from form response or data
	$effect(() => {
		if (form?.inviteCode) {
			// Update was from generateInvite action
		}
	});

	const activeInviteCode = $derived(form?.inviteCode || data.activeInviteCode);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Settings</h1>

	{#if form?.error}
		<div class="rounded-md bg-red-50 p-4">
			<p class="text-sm text-red-700">{form.error}</p>
		</div>
	{/if}

	{#if form?.success}
		<div class="rounded-md bg-green-50 p-4">
			<p class="text-sm text-green-700">{form.success}</p>
		</div>
	{/if}

	<!-- Currency Setting -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Currency</h2>
		<form
			method="POST"
			action="?/updateCurrency"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="flex gap-4 items-end">
				<div class="flex-1">
					<label for="currency" class="label">Display Currency</label>
					<select
						id="currency"
						name="currency"
						class="input"
						value={data.settings?.currency ?? 'EUR'}
					>
						{#each currencies as currency}
							<option value={currency.code}>
								{currency.symbol} - {currency.name} ({currency.code})
							</option>
						{/each}
					</select>
				</div>
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Saving...' : 'Save'}
				</button>
			</div>
		</form>
	</div>

	<!-- Family Section -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Family</h2>

		{#if data.family}
			<div class="space-y-4">
				<div>
					<p class="text-sm text-gray-500">Family Name</p>
					<p class="font-medium text-gray-900">{data.family.name}</p>
				</div>

				<div>
					<p class="text-sm text-gray-500 mb-2">Family Members</p>
					<div class="space-y-2">
						{#each data.familyMembers as member}
							<div class="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
								{#if member.photo_data}
									<img
										src={member.photo_data}
										alt={member.name}
										class="w-8 h-8 rounded-full object-cover"
									/>
								{:else if member.photo_url}
									<img
										src={member.photo_url}
										alt={member.name}
										class="w-8 h-8 rounded-full object-cover"
									/>
								{:else}
									<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
										<span class="text-sm font-medium text-blue-600"
											>{member.name.charAt(0).toUpperCase()}</span
										>
									</div>
								{/if}
								<div>
									<p class="text-sm font-medium text-gray-900">{member.name}</p>
									<p class="text-xs text-gray-500">{member.email}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="border-t pt-4">
					<p class="text-sm text-gray-500 mb-2">Invite Family Member</p>

					{#if activeInviteCode}
						<div class="bg-blue-50 rounded-lg p-4">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="font-mono text-lg font-bold text-blue-900 tracking-wider">
										{activeInviteCode.code}
									</p>
									<p class="text-xs text-blue-600 mt-1">
										Expires {formatExpiry(activeInviteCode.expiresAt)}
									</p>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										class="btn-secondary text-sm"
										onclick={() => copyInviteCode(activeInviteCode.code)}
									>
										{copiedCode ? 'Copied!' : 'Copy'}
									</button>
									<form
										method="POST"
										action="?/revokeInvite"
										use:enhance={() => {
											loading = true;
											return async ({ update }) => {
												loading = false;
												await update();
											};
										}}
									>
										<input type="hidden" name="code" value={activeInviteCode.code} />
										<button type="submit" class="btn-danger text-sm" disabled={loading}>
											Revoke
										</button>
									</form>
								</div>
							</div>
							<p class="text-xs text-blue-700 mt-2">
								Share this code with a family member. They can use it when registering to join your
								family.
							</p>
						</div>
					{:else}
						<form
							method="POST"
							action="?/generateInvite"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update();
								};
							}}
						>
							<button type="submit" class="btn-primary" disabled={loading}>
								{loading ? 'Generating...' : 'Generate Invite Code'}
							</button>
						</form>
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-sm text-gray-500">Family information not available.</p>
		{/if}
	</div>

	<!-- Webhook Setting -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Webhook</h2>
		<p class="text-sm text-gray-500 mb-4">
			Receive notifications when events occur (transactions, balance changes, etc). The webhook URL
			will receive POST requests with JSON data.
		</p>

		<form
			method="POST"
			action="?/updateWebhook"
			use:enhance={() => {
				webhookLoading = true;
				return async ({ update }) => {
					webhookLoading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="webhookUrl" class="label">Webhook URL</label>
				<input
					id="webhookUrl"
					name="webhookUrl"
					type="url"
					class="input"
					value={data.settings?.webhook_url ?? ''}
					placeholder="https://example.com/webhook"
				/>
				<p class="mt-1 text-sm text-gray-500">Leave empty to disable webhooks.</p>
			</div>

			<button type="submit" class="btn-primary" disabled={webhookLoading}>
				{webhookLoading ? 'Saving...' : 'Save Webhook'}
			</button>
		</form>

		{#if data.settings?.webhook_url}
			<div class="mt-4 p-3 bg-gray-50 rounded-lg">
				<p class="text-sm font-medium text-gray-700 mb-2">Webhook Events</p>
				<ul class="text-xs text-gray-600 space-y-1">
					<li>
						<code class="bg-gray-200 px-1 rounded">transaction.created</code> - New transaction
					</li>
					<li>
						<code class="bg-gray-200 px-1 rounded">recurring_payment.processed</code> - Recurring payment
						processed
					</li>
					<li>
						<code class="bg-gray-200 px-1 rounded">child.created</code> - Child profile created
					</li>
					<li>
						<code class="bg-gray-200 px-1 rounded">child.updated</code> - Child profile updated
					</li>
					<li>
						<code class="bg-gray-200 px-1 rounded">child.deleted</code> - Child profile deleted
					</li>
				</ul>
			</div>
		{/if}
	</div>

	<!-- PIN Setting -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">PIN Protection</h2>
		<p class="text-sm text-gray-500 mb-4">
			Add an extra layer of security by requiring a PIN to access the app after a period of
			inactivity.
		</p>

		{#if data.settings?.pin_enabled}
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<span
						class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
					>
						Enabled
					</span>
				</div>

				<form method="POST" action="?/updatePinTimeout" use:enhance class="flex gap-4 items-end">
					<div class="flex-1">
						<label for="timeout" class="label">PIN Timeout</label>
						<select
							id="timeout"
							name="timeout"
							class="input"
							value={data.settings.pin_timeout_minutes}
						>
							<option value="1">1 minute</option>
							<option value="2">2 minutes</option>
							<option value="5">5 minutes</option>
							<option value="10">10 minutes</option>
						</select>
					</div>
					<button type="submit" class="btn-primary">Save</button>
				</form>

				<div class="flex gap-3">
					<button
						type="button"
						class="btn-secondary"
						onclick={() => {
							pinAction = 'change';
							showPinModal = true;
						}}
					>
						Change PIN
					</button>
					<button
						type="button"
						class="btn-danger"
						onclick={() => {
							pinAction = 'disable';
							showPinModal = true;
						}}
					>
						Disable PIN
					</button>
				</div>
			</div>
		{:else}
			<button
				type="button"
				class="btn-primary"
				onclick={() => {
					pinAction = 'enable';
					showPinModal = true;
				}}
			>
				Enable PIN
			</button>
		{/if}
	</div>
</div>

<!-- PIN Modal -->
{#if showPinModal}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<button
				type="button"
				class="fixed inset-0 bg-black/50"
				onclick={() => (showPinModal = false)}
				aria-label="Close"
			></button>
			<div class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<h2 class="text-lg font-semibold text-gray-900">
					{#if pinAction === 'enable'}
						Set PIN
					{:else if pinAction === 'change'}
						Change PIN
					{:else}
						Disable PIN
					{/if}
				</h2>

				<form
					method="POST"
					action="?/{pinAction === 'disable' ? 'disablePin' : 'setPin'}"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') showPinModal = false;
							await update();
						};
					}}
					class="mt-4 space-y-4"
				>
					{#if pinAction !== 'enable'}
						<div>
							<label for="currentPin" class="label">Current PIN</label>
							<input
								id="currentPin"
								name="currentPin"
								type="password"
								inputmode="numeric"
								pattern="[0-9]{'{'}4,6}"
								minlength={4}
								maxlength={6}
								required
								class="input"
								placeholder="Enter current PIN"
							/>
						</div>
					{/if}

					{#if pinAction !== 'disable'}
						<div>
							<label for="newPin" class="label">
								{pinAction === 'enable' ? 'PIN' : 'New PIN'} (4-6 digits)
							</label>
							<input
								id="newPin"
								name="newPin"
								type="password"
								inputmode="numeric"
								pattern="[0-9]{'{'}4,6}"
								minlength={4}
								maxlength={6}
								required
								class="input"
								placeholder="Enter PIN"
							/>
						</div>
						<div>
							<label for="confirmPin" class="label">Confirm PIN</label>
							<input
								id="confirmPin"
								name="confirmPin"
								type="password"
								inputmode="numeric"
								pattern="[0-9]{'{'}4,6}"
								minlength={4}
								maxlength={6}
								required
								class="input"
								placeholder="Confirm PIN"
							/>
						</div>
					{/if}

					<div class="flex justify-end gap-3 pt-4">
						<button type="button" class="btn-secondary" onclick={() => (showPinModal = false)}>
							Cancel
						</button>
						<button
							type="submit"
							class={pinAction === 'disable' ? 'btn-danger' : 'btn-primary'}
							disabled={loading}
						>
							{#if loading}
								Processing...
							{:else if pinAction === 'enable'}
								Enable PIN
							{:else if pinAction === 'change'}
								Change PIN
							{:else}
								Disable PIN
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
