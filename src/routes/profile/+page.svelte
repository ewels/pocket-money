<script lang="ts">
	import { enhance } from '$app/forms';
	import { getInitials } from '$lib/utils';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';

	let { data, form } = $props();

	let loading = $state(false);
	let emailLoading = $state(false);
	let passwordLoading = $state(false);
	let showPinModal = $state(false);
	let pinAction = $state<'enable' | 'change' | 'disable'>('enable');
	let pinLoading = $state(false);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Profile</h1>

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

	<div class="card p-6">
		<form
			method="POST"
			action="?/updateProfile"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-6"
		>
			<!-- Photo -->
			<div class="flex items-center gap-6">
				{#if data.user?.photo_data}
					<img
						src={data.user.photo_data}
						alt={data.user.name}
						class="h-24 w-24 rounded-full object-cover"
					/>
				{:else}
					<div
						class="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600"
					>
						{getInitials(data.user?.name ?? '')}
					</div>
				{/if}
				<div class="flex flex-col gap-2">
					<PhotoUpload name="photo" />
					{#if data.user?.photo_data}
						<button
							type="button"
							class="text-sm text-red-600 hover:text-red-800"
							onclick={(e) => {
								e.preventDefault();
								const form = document.createElement('form');
								form.method = 'POST';
								form.action = '?/deleteAvatar';
								document.body.appendChild(form);
								form.submit();
							}}
						>
							Remove photo
						</button>
					{/if}
				</div>
			</div>

			<!-- Name -->
			<div>
				<label for="name" class="label">Name</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					class="input"
					value={data.user?.name ?? ''}
				/>
				<p class="mt-1 text-sm text-gray-500">This name appears in transaction history.</p>
			</div>

			<div class="pt-4">
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	</div>

	<!-- Change Email -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Change Email</h2>
		<form
			method="POST"
			action="?/updateEmail"
			use:enhance={() => {
				emailLoading = true;
				return async ({ update }) => {
					emailLoading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="currentEmail" class="label">Current Email</label>
				<input
					id="currentEmail"
					type="email"
					class="input bg-gray-50"
					value={data.user?.email ?? ''}
					disabled
				/>
			</div>

			<div>
				<label for="newEmail" class="label">New Email</label>
				<input id="newEmail" name="newEmail" type="email" required class="input" />
			</div>

			<div>
				<label for="emailCurrentPassword" class="label">Current Password</label>
				<input
					id="emailCurrentPassword"
					name="currentPassword"
					type="password"
					required
					class="input"
					autocomplete="current-password"
				/>
			</div>

			<div class="pt-2">
				<button type="submit" class="btn-primary" disabled={emailLoading}>
					{emailLoading ? 'Updating...' : 'Update Email'}
				</button>
			</div>
		</form>
	</div>

	<!-- Change Password -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
		<form
			method="POST"
			action="?/updatePassword"
			use:enhance={() => {
				passwordLoading = true;
				return async ({ update }) => {
					passwordLoading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="passwordCurrentPassword" class="label">Current Password</label>
				<input
					id="passwordCurrentPassword"
					name="currentPassword"
					type="password"
					required
					class="input"
					autocomplete="current-password"
				/>
			</div>

			<div>
				<label for="newPassword" class="label">New Password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					required
					minlength="8"
					class="input"
					autocomplete="new-password"
				/>
				<p class="mt-1 text-sm text-gray-500">Must be at least 8 characters.</p>
			</div>

			<div>
				<label for="confirmPassword" class="label">Confirm New Password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minlength="8"
					class="input"
					autocomplete="new-password"
				/>
			</div>

			<div class="pt-2">
				<button type="submit" class="btn-primary" disabled={passwordLoading}>
					{passwordLoading ? 'Updating...' : 'Update Password'}
				</button>
			</div>
		</form>
	</div>

	<!-- PIN Protection -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">PIN Protection</h2>
		<p class="text-sm text-gray-500 mb-4">
			Add an extra layer of security by requiring a PIN to access the app after a period of
			inactivity.
		</p>

		{#if data.user?.pin_enabled}
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
						<select id="timeout" name="timeout" class="input">
							<option value="1" selected={data.user.pin_timeout_minutes === 1}>1 minute</option>
							<option value="2" selected={data.user.pin_timeout_minutes === 2}>2 minutes</option>
							<option value="5" selected={data.user.pin_timeout_minutes === 5}>5 minutes</option>
							<option value="10" selected={data.user.pin_timeout_minutes === 10}>10 minutes</option>
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
						pinLoading = true;
						return async ({ result, update }) => {
							pinLoading = false;
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
							disabled={pinLoading}
						>
							{#if pinLoading}
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
