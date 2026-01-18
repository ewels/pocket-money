<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { getInitials, colorHexMap, type ChildColor } from '$lib/utils';
	import { formatMoney } from '$lib/currencies';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import AddTargetModal from '$lib/components/AddTargetModal.svelte';

	let { data, form } = $props();

	let loading = $state(false);
	let selectedColor = $state(data.child.color);
	let showDeleteConfirm = $state(false);
	let showAddTarget = $state(false);
	let showAddRecurring = $state(false);
	let editingTarget = $state<string | null>(null);

	// Drag and drop state
	let draggedTargetId = $state<string | null>(null);
	let dragOverTargetId = $state<string | null>(null);
	// eslint-disable-next-line svelte/prefer-writable-derived -- need local state for optimistic drag updates
	let targetOrder = $state<string[]>(data.targets.map((t) => t.id));
	let reorderMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Reset order when data changes
	$effect(() => {
		targetOrder = data.targets.map((t) => t.id);
	});

	function handleDragStart(e: DragEvent, targetId: string) {
		draggedTargetId = targetId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', targetId);
		}
	}

	function handleDragOver(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (draggedTargetId && draggedTargetId !== targetId) {
			dragOverTargetId = targetId;
		}
	}

	function handleDragLeave() {
		dragOverTargetId = null;
	}

	async function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (!draggedTargetId || draggedTargetId === targetId) return;

		const fromIndex = targetOrder.indexOf(draggedTargetId);
		const toIndex = targetOrder.indexOf(targetId);

		if (fromIndex !== -1 && toIndex !== -1) {
			const newOrder = [...targetOrder];
			newOrder.splice(fromIndex, 1);
			newOrder.splice(toIndex, 0, draggedTargetId);
			targetOrder = newOrder;

			// Submit reorder
			const formData = new FormData();
			formData.set('order', JSON.stringify(newOrder));
			try {
				const response = await fetch('?/reorderTargets', {
					method: 'POST',
					body: formData,
					headers: {
						'x-sveltekit-action': 'true'
					}
				});
				const result = (await response.json()) as { type: string };
				if (result.type === 'success') {
					reorderMessage = { type: 'success', text: 'Order saved' };
				} else {
					reorderMessage = { type: 'error', text: 'Failed to save order' };
				}
			} catch {
				reorderMessage = { type: 'error', text: 'Failed to save order' };
			}
			setTimeout(() => (reorderMessage = null), 2000);
		}

		draggedTargetId = null;
		dragOverTargetId = null;
	}

	function handleDragEnd() {
		draggedTargetId = null;
		dragOverTargetId = null;
	}

	// Touch drag support
	let touchTargetId = $state<string | null>(null);

	function handleTouchStart(_e: TouchEvent, targetId: string) {
		touchTargetId = targetId;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!touchTargetId) return;
		const touch = e.touches[0];
		const element = document.elementFromPoint(touch.clientX, touch.clientY);
		const targetEl = element?.closest('[data-target-id]') as HTMLElement | null;
		if (targetEl) {
			const overId = targetEl.dataset.targetId;
			if (overId && overId !== touchTargetId) {
				dragOverTargetId = overId;
			}
		}
	}

	async function handleTouchEnd() {
		if (touchTargetId && dragOverTargetId && touchTargetId !== dragOverTargetId) {
			const fromIndex = targetOrder.indexOf(touchTargetId);
			const toIndex = targetOrder.indexOf(dragOverTargetId);

			if (fromIndex !== -1 && toIndex !== -1) {
				const newOrder = [...targetOrder];
				newOrder.splice(fromIndex, 1);
				newOrder.splice(toIndex, 0, touchTargetId);
				targetOrder = newOrder;

				const formData = new FormData();
				formData.set('order', JSON.stringify(newOrder));
				try {
					const response = await fetch('?/reorderTargets', {
						method: 'POST',
						body: formData,
						headers: {
							'x-sveltekit-action': 'true'
						}
					});
					const result = (await response.json()) as { type: string };
					if (result.type === 'success') {
						reorderMessage = { type: 'success', text: 'Order saved' };
					} else {
						reorderMessage = { type: 'error', text: 'Failed to save order' };
					}
				} catch {
					reorderMessage = { type: 'error', text: 'Failed to save order' };
				}
				setTimeout(() => (reorderMessage = null), 2000);
			}
		}
		touchTargetId = null;
		dragOverTargetId = null;
	}

	// Get ordered targets based on current order
	const orderedTargets = $derived(
		targetOrder
			.map((id) => data.targets.find((t) => t.id === id))
			.filter(Boolean) as typeof data.targets
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/child/{data.child.id}" class="text-gray-500 hover:text-gray-700">
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
				/>
			</svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-900">{data.child.name}'s Settings</h1>
	</div>

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

	<!-- Basic Info -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Info</h2>
		<form
			method="POST"
			action="?/updateChild"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<div class="flex items-center gap-6">
				{#if data.child.photo_data}
					<img
						src={data.child.photo_data}
						alt={data.child.name}
						class="h-20 w-20 rounded-full object-cover ring-4"
						style="--tw-ring-color: {colorHexMap[selectedColor as ChildColor]}40"
					/>
				{:else}
					<div
						class="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white bg-child-{selectedColor}"
					>
						{getInitials(data.child.name)}
					</div>
				{/if}
				<div class="flex flex-col gap-2">
					<PhotoUpload name="photo" />
					{#if data.child.photo_data}
						<button
							type="button"
							class="text-sm text-red-600 hover:text-red-800 text-left"
							onclick={async () => {
								await fetch('?/deleteChildPhoto', {
									method: 'POST',
									headers: {
										'x-sveltekit-action': 'true'
									}
								});
								await invalidateAll();
							}}
						>
							Remove photo
						</button>
					{/if}
				</div>
			</div>

			<div>
				<label for="name" class="label">Name</label>
				<input id="name" name="name" type="text" required class="input" value={data.child.name} />
			</div>

			<div>
				<label class="label">Color</label>
				<input type="hidden" name="color" value={selectedColor} />
				<ColorPicker bind:selected={selectedColor} />
			</div>

			<div class="pt-2">
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	</div>

	<!-- Saving Targets -->
	<div class="card p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900">Saving Targets</h2>
			<button type="button" class="btn-primary text-sm" onclick={() => (showAddTarget = true)}>
				Add Target
			</button>
		</div>

		{#if orderedTargets.length === 0}
			<p class="text-gray-500 text-center py-4">No saving targets yet</p>
		{:else}
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-gray-400">Drag to reorder (first target is filled first)</p>
				{#if reorderMessage}
					<p
						class="text-xs {reorderMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}"
					>
						{reorderMessage.text}
					</p>
				{/if}
			</div>
			<div class="space-y-2">
				{#each orderedTargets as target (target.id)}
					<div
						class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg transition-all {dragOverTargetId ===
						target.id
							? 'ring-2 ring-blue-400 bg-blue-50'
							: ''} {draggedTargetId === target.id || touchTargetId === target.id
							? 'opacity-50'
							: ''}"
						draggable="true"
						data-target-id={target.id}
						ondragstart={(e) => handleDragStart(e, target.id)}
						ondragover={(e) => handleDragOver(e, target.id)}
						ondragleave={handleDragLeave}
						ondrop={(e) => handleDrop(e, target.id)}
						ondragend={handleDragEnd}
						ontouchstart={(e) => handleTouchStart(e, target.id)}
						ontouchmove={handleTouchMove}
						ontouchend={handleTouchEnd}
					>
						<!-- Drag handle -->
						<div class="cursor-grab text-gray-400 hover:text-gray-600 touch-none">
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
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						</div>
						{#if target.photo_data}
							<img
								src={target.photo_data}
								alt={target.name}
								class="w-10 h-10 rounded object-cover shrink-0"
							/>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium text-gray-900 truncate">{target.name}</p>
							<p class="text-sm text-gray-500">
								Target: {formatMoney(target.target_amount, data.settings?.currency ?? 'EUR')}
							</p>
						</div>
						<div class="flex gap-1 shrink-0">
							<button
								type="button"
								class="p-2 text-gray-400 hover:text-gray-600"
								onclick={() => (editingTarget = target.id)}
							>
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
										d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
									/>
								</svg>
							</button>
							<form method="POST" action="?/deleteTarget" use:enhance>
								<input type="hidden" name="targetId" value={target.id} />
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
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recurring Payments -->
	<div class="card p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900">Recurring Payments</h2>
			<button type="button" class="btn-primary text-sm" onclick={() => (showAddRecurring = true)}>
				Add Rule
			</button>
		</div>

		{#if data.recurringRules.length === 0}
			<p class="text-gray-500 text-center py-4">No recurring payments set up</p>
		{:else}
			<div class="space-y-3">
				{#each data.recurringRules as rule (rule.id)}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex-1">
							<p class="font-medium text-gray-900">
								{formatMoney(rule.amount, data.settings?.currency ?? 'EUR')}
								{#if rule.description}
									<span class="font-normal text-gray-500">- {rule.description}</span>
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
						<div class="flex gap-1">
							<form method="POST" action="?/toggleRule" use:enhance>
								<input type="hidden" name="ruleId" value={rule.id} />
								<input type="hidden" name="active" value={rule.active ? '0' : '1'} />
								<button
									type="submit"
									class="p-2 {rule.active ? 'text-green-500' : 'text-gray-400'} hover:text-gray-600"
									title={rule.active ? 'Pause' : 'Resume'}
								>
									{#if rule.active}
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
												d="M15.75 5.25v13.5m-7.5-13.5v13.5"
											/>
										</svg>
									{:else}
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
												d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
											/>
										</svg>
									{/if}
								</button>
							</form>
							{#if rule.active}
								<form method="POST" action="?/toggleSkip" use:enhance>
									<input type="hidden" name="ruleId" value={rule.id} />
									<input type="hidden" name="skip" value={rule.skip_next ? '0' : '1'} />
									<button
										type="submit"
										class="p-2 {rule.skip_next
											? 'text-orange-500'
											: 'text-gray-400'} hover:text-gray-600"
										title={rule.skip_next ? 'Cancel skip' : 'Skip next'}
									>
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
												d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z"
											/>
										</svg>
									</button>
								</form>
							{/if}
							<form method="POST" action="?/deleteRule" use:enhance>
								<input type="hidden" name="ruleId" value={rule.id} />
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
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Danger Zone -->
	<div class="card p-6 border-red-200">
		<h2 class="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
		<p class="text-sm text-gray-500 mb-4">
			Delete this child and all their transaction history. This action cannot be undone.
		</p>
		<button type="button" class="btn-danger" onclick={() => (showDeleteConfirm = true)}>
			Delete {data.child.name}
		</button>
	</div>
</div>

<!-- Add Target Modal -->
<AddTargetModal bind:open={showAddTarget} />

<!-- Add Recurring Modal -->
{#if showAddRecurring}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<button
				type="button"
				class="fixed inset-0 bg-black/50"
				onclick={() => (showAddRecurring = false)}
				aria-label="Close"
			></button>
			<div class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<h2 class="text-lg font-semibold text-gray-900">Add Recurring Payment</h2>
				<form
					method="POST"
					action="?/addRecurring"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') showAddRecurring = false;
							await update();
						};
					}}
					class="mt-4 space-y-4"
				>
					<div>
						<label for="recurringAmount" class="label">Amount</label>
						<input
							id="recurringAmount"
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
						<label for="recurringDescription" class="label">Description (optional)</label>
						<input
							id="recurringDescription"
							name="description"
							type="text"
							class="input"
							placeholder="e.g., Weekly allowance"
						/>
					</div>
					<div>
						<label for="intervalDays" class="label">Repeat every</label>
						<select id="intervalDays" name="intervalDays" class="input">
							<option value="1">Daily</option>
							<option value="7" selected>Weekly</option>
							<option value="14">Every 2 weeks</option>
							<option value="30">Monthly</option>
						</select>
					</div>
					<div class="flex justify-end gap-3 pt-4">
						<button type="button" class="btn-secondary" onclick={() => (showAddRecurring = false)}
							>Cancel</button
						>
						<button type="submit" class="btn-primary">Add Rule</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Target Modal -->
{#if editingTarget}
	{@const target = data.targets.find((t) => t.id === editingTarget)}
	{#if target}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-full items-center justify-center p-4">
				<button
					type="button"
					class="fixed inset-0 bg-black/50"
					onclick={() => (editingTarget = null)}
					aria-label="Close"
				></button>
				<div
					class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
				>
					<h2 class="text-lg font-semibold text-gray-900">Edit Saving Target</h2>
					<form
						method="POST"
						action="?/updateTarget"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success') editingTarget = null;
								await update();
							};
						}}
						class="mt-4 space-y-4"
					>
						<input type="hidden" name="targetId" value={target.id} />
						<div>
							<label for="editTargetName" class="label">Name</label>
							<input
								id="editTargetName"
								name="name"
								type="text"
								required
								class="input"
								value={target.name}
							/>
						</div>
						<div>
							<label for="editTargetAmount" class="label">Target Amount</label>
							<input
								id="editTargetAmount"
								name="amount"
								type="number"
								step="0.01"
								min="0.01"
								required
								class="input"
								value={target.target_amount}
							/>
						</div>
						<div>
							<label for="editTargetDescription" class="label">Description (optional)</label>
							<input
								id="editTargetDescription"
								name="description"
								type="text"
								class="input"
								value={target.description ?? ''}
								placeholder="e.g., Blue mountain bike from the store"
							/>
						</div>
						<div>
							<label for="editTargetLink" class="label">Link (optional)</label>
							<input
								id="editTargetLink"
								name="link"
								type="url"
								class="input"
								value={target.link ?? ''}
								placeholder="https://example.com/product"
							/>
							<p class="mt-1 text-xs text-gray-500">Link to where the item can be purchased</p>
						</div>
						<div>
							<label class="label">Photo (optional)</label>
							{#if target.photo_data}
								<div class="mb-2">
									<img
										src={target.photo_data}
										alt={target.name}
										class="w-20 h-20 rounded-lg object-cover"
									/>
									<div class="flex items-center gap-2 mt-1">
										<p class="text-xs text-gray-500">Current photo (upload new to replace)</p>
										<button
											type="button"
											class="text-xs text-red-600 hover:text-red-800"
											onclick={async () => {
												const formData = new FormData();
												formData.set('targetId', target.id);
												await fetch('?/deleteTargetPhoto', {
													method: 'POST',
													body: formData,
													headers: {
														'x-sveltekit-action': 'true'
													}
												});
												editingTarget = null;
												await invalidateAll();
											}}
										>
											Remove
										</button>
									</div>
								</div>
							{/if}
							<PhotoUpload name="photo" />
						</div>
						<div class="flex justify-end gap-3 pt-4">
							<button type="button" class="btn-secondary" onclick={() => (editingTarget = null)}
								>Cancel</button
							>
							<button type="submit" class="btn-primary">Save</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<button
				type="button"
				class="fixed inset-0 bg-black/50"
				onclick={() => (showDeleteConfirm = false)}
				aria-label="Close"
			></button>
			<div class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<h2 class="text-lg font-semibold text-red-600">Delete {data.child.name}?</h2>
				<p class="mt-2 text-sm text-gray-500">
					This will permanently delete {data.child.name} and all their transaction history. This action
					cannot be undone.
				</p>
				<form method="POST" action="?/deleteChild" class="mt-6 flex justify-end gap-3">
					<button type="button" class="btn-secondary" onclick={() => (showDeleteConfirm = false)}
						>Cancel</button
					>
					<button type="submit" class="btn-danger">Delete</button>
				</form>
			</div>
		</div>
	</div>
{/if}
