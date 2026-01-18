<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let isRegister = $state(false);
	let loading = $state(false);
</script>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h1 class="text-center text-3xl font-bold text-blue-600">Pocket Money</h1>
		<h2 class="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
			{isRegister ? 'Create your account' : 'Sign in to your account'}
		</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-700">{form.error}</p>
				</div>
			{/if}

			<form
				method="POST"
				action={isRegister ? '?/register' : '?/login'}
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
				class="space-y-6"
			>
				{#if isRegister}
					<div>
						<label for="name" class="label">Name</label>
						<input
							id="name"
							name="name"
							type="text"
							autocomplete="name"
							required
							class="input"
							placeholder="Your name"
						/>
					</div>
				{/if}

				<div>
					<label for="email" class="label">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="input"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="label">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete={isRegister ? 'new-password' : 'current-password'}
						required
						minlength="8"
						class="input"
						placeholder="********"
					/>
				</div>

				{#if isRegister}
					<div>
						<label for="confirmPassword" class="label">Confirm Password</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autocomplete="new-password"
							required
							minlength="8"
							class="input"
							placeholder="********"
						/>
					</div>

					<div>
						<label for="inviteCode" class="label">
							Invite Code <span class="text-gray-400 font-normal">(optional)</span>
						</label>
						<input
							id="inviteCode"
							name="inviteCode"
							type="text"
							class="input uppercase"
							placeholder="ABC12XY3"
							maxlength="8"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Have an invite code? Enter it to join an existing family.
						</p>
					</div>
				{/if}

				<div>
					<button type="submit" class="btn-primary w-full" disabled={loading}>
						{#if loading}
							<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
						{/if}
						{isRegister ? 'Create account' : 'Sign in'}
					</button>
				</div>
			</form>

			<div class="mt-6">
				<button
					type="button"
					onclick={() => (isRegister = !isRegister)}
					class="w-full text-center text-sm text-blue-600 hover:text-blue-500"
				>
					{isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
				</button>
			</div>
		</div>
	</div>
</div>
