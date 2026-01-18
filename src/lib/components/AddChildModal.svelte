<script lang="ts">
	import { enhance } from '$app/forms';
	import ColorPicker from './ColorPicker.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let selectedColor = $state('blue');
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
				class="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-xl transition-all"
			>
				<h2 class="text-lg font-semibold text-gray-900">Add Child</h2>

				<form
					method="POST"
					action="/?/addChild"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') {
								open = false;
								selectedColor = 'blue';
							}
							await update();
						};
					}}
					class="mt-4 space-y-4"
				>
					<div>
						<label for="childName" class="label">Name</label>
						<input
							id="childName"
							name="name"
							type="text"
							required
							class="input"
							placeholder="Child's name"
						/>
					</div>

					<div>
						<label class="label">Color</label>
						<input type="hidden" name="color" value={selectedColor} />
						<ColorPicker bind:selected={selectedColor} />
					</div>

					<div class="flex justify-end gap-3 pt-4">
						<button type="button" class="btn-secondary" onclick={() => (open = false)}>
							Cancel
						</button>
						<button type="submit" class="btn-primary" disabled={loading}>
							{loading ? 'Adding...' : 'Add Child'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
