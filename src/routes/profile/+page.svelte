<script lang="ts">
	import { enhance } from '$app/forms';
	import { getInitials } from '$lib/utils';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';

	let { data, form } = $props();

	let loading = $state(false);
	let emailLoading = $state(false);
	let passwordLoading = $state(false);
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
</div>
