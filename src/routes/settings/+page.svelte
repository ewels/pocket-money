<script lang="ts">
	import { enhance } from '$app/forms';
	import { currencies } from '$lib/currencies';
	import { getInitials } from '$lib/utils';
	import AddChildModal from '$lib/components/AddChildModal.svelte';

	let { data, form } = $props();

	let showAddChild = $state(false);

	let loading = $state(false);
	let copiedCode = $state(false);
	let copiedSecret = $state(false);
	let webhookLoading = $state(false);

	function copyWebhookSecret(secret: string) {
		navigator.clipboard.writeText(secret);
		copiedSecret = true;
		setTimeout(() => (copiedSecret = false), 2000);
	}

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
					<p class="text-sm text-gray-500 mb-2">Guardians</p>
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

				<!-- Invite New Guardian -->
				<div class="border-t pt-4">
					<p class="text-sm text-gray-500 mb-2">Invite New Guardian</p>

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

				<!-- Children Section -->
				<div class="border-t pt-4">
					<p class="text-sm text-gray-500 mb-2">Children</p>
					{#if data.children.length === 0}
						<div class="text-center py-8 bg-gray-50 rounded-lg">
							<svg
								class="mx-auto h-10 w-10 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
								/>
							</svg>
							<p class="mt-2 text-sm text-gray-600">No children yet</p>
							<button type="button" class="mt-3 btn-primary" onclick={() => (showAddChild = true)}>
								<svg
									class="mr-2 h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Add Child
							</button>
						</div>
					{:else}
						<div class="space-y-2">
							{#each data.children as child}
								<div class="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-50">
									<a href="/child/{child.id}" class="flex items-center gap-3 flex-1 min-w-0">
										{#if child.photo_data}
											<img
												src={child.photo_data}
												alt={child.name}
												class="w-8 h-8 rounded-full object-cover"
											/>
										{:else}
											<div
												class="w-8 h-8 rounded-full flex items-center justify-center"
												style="background-color: var(--color-{child.color}-100, #dbeafe)"
											>
												<span
													class="text-sm font-medium"
													style="color: var(--color-{child.color}-600, #2563eb)"
												>
													{getInitials(child.name)}
												</span>
											</div>
										{/if}
										<p class="text-sm font-medium text-gray-900 truncate">{child.name}</p>
									</a>
									<div class="flex items-center gap-2">
										<a href="/child/{child.id}" class="text-sm text-blue-600 hover:text-blue-800">
											View
										</a>
										<a
											href="/child/{child.id}/config"
											class="text-sm text-gray-500 hover:text-gray-700"
										>
											Edit
										</a>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-3">
							<button type="button" class="btn-primary" onclick={() => (showAddChild = true)}>
								<svg
									class="mr-2 h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Add Child
							</button>
						</div>
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
			will receive POST requests with JSON data. See the <a
				href="https://ewels.github.io/pocket-money/guide/webhooks/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-600 hover:text-blue-800 underline">webhook documentation</a
			> for payload examples.
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
			<div class="mt-4 space-y-4">
				<!-- Webhook Secret -->
				<div class="p-3 bg-gray-50 rounded-lg">
					<p class="text-sm font-medium text-gray-700 mb-2">Webhook Secret</p>
					<p class="text-xs text-gray-500 mb-2">
						Use this secret to verify that webhooks are from Pocket Money. The signature is sent in
						the <code class="bg-gray-200 px-1 rounded">X-Webhook-Signature</code> header.
					</p>
					{#if data.settings.webhook_secret}
						<div class="flex items-center gap-2">
							<code class="flex-1 bg-gray-200 px-2 py-1 rounded text-sm font-mono break-all">
								{data.settings.webhook_secret}
							</code>
							<button
								type="button"
								class="btn-secondary text-sm shrink-0"
								onclick={() => copyWebhookSecret(data.settings?.webhook_secret ?? '')}
							>
								{copiedSecret ? 'Copied!' : 'Copy'}
							</button>
						</div>
						<form
							method="POST"
							action="?/regenerateWebhookSecret"
							use:enhance={() => {
								webhookLoading = true;
								return async ({ update }) => {
									webhookLoading = false;
									await update();
								};
							}}
							class="mt-2"
						>
							<button
								type="submit"
								class="text-sm text-red-600 hover:text-red-800"
								disabled={webhookLoading}
							>
								Regenerate Secret
							</button>
						</form>
					{:else}
						<form
							method="POST"
							action="?/regenerateWebhookSecret"
							use:enhance={() => {
								webhookLoading = true;
								return async ({ update }) => {
									webhookLoading = false;
									await update();
								};
							}}
						>
							<button type="submit" class="btn-secondary text-sm" disabled={webhookLoading}>
								{webhookLoading ? 'Generating...' : 'Generate Secret'}
							</button>
						</form>
					{/if}
				</div>

				<!-- Webhook Events -->
				<div class="p-3 bg-gray-50 rounded-lg">
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
			</div>
		{/if}
	</div>
</div>

<AddChildModal bind:open={showAddChild} />
