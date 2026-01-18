<script lang="ts">
	import { enhance } from '$app/forms';
	import PhotoUpload from './PhotoUpload.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let loading = $state(false);
</script>

{#if open}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Backdrop -->
			<button
				type="button"
				class="fixed inset-0 bg-black/50 transition-opacity"
				onclick={() => (open = false)}
				aria-label="Close modal"
			></button>

			<!-- Modal -->
			<div
				class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
			>
				<h2 class="text-lg font-semibold text-gray-900">Add Saving Target</h2>

				<form
					method="POST"
					action="?/addTarget"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') {
								open = false;
							}
							await update();
						};
					}}
					class="mt-4 space-y-4"
				>
					<div>
						<label for="targetName" class="label">Name</label>
						<input
							id="targetName"
							name="name"
							type="text"
							required
							class="input"
							placeholder="e.g., New bike"
						/>
					</div>
					<div>
						<label for="targetAmount" class="label">Target Amount</label>
						<input
							id="targetAmount"
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
						<label for="targetDescription" class="label">Description (optional)</label>
						<input
							id="targetDescription"
							name="description"
							type="text"
							class="input"
							placeholder="e.g., Blue mountain bike from the store"
						/>
					</div>
					<div>
						<label for="targetLink" class="label">Link (optional)</label>
						<input
							id="targetLink"
							name="link"
							type="url"
							class="input"
							placeholder="https://example.com/product"
						/>
						<p class="mt-1 text-xs text-gray-500">Link to where the item can be purchased</p>
					</div>
					<div role="group" aria-labelledby="add-target-photo-label">
						<span id="add-target-photo-label" class="label">Photo (optional)</span>
						<PhotoUpload name="photo" />
					</div>
					<div class="flex justify-end gap-3 pt-4">
						<button type="button" class="btn-secondary" onclick={() => (open = false)}>
							Cancel
						</button>
						<button type="submit" class="btn-primary" disabled={loading}>
							{loading ? 'Adding...' : 'Add Target'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
