<script lang="ts">
	let {
		value = $bindable('Europe/London'),
		id = 'timezone',
		name = 'timezone'
	}: {
		value?: string;
		id?: string;
		name?: string;
	} = $props();

	// Build full list of timezones with current UTC offset label
	const allTimezones = Intl.supportedValuesOf('timeZone').map((tz) => {
		const offset =
			new Intl.DateTimeFormat('en', {
				timeZone: tz,
				timeZoneName: 'shortOffset'
			})
				.formatToParts(new Date())
				.find((p) => p.type === 'timeZoneName')?.value ?? '';
		const label = tz.replace(/_/g, ' ') + ' ' + offset;
		return { value: tz, label, search: label.toLowerCase() };
	});

	let query = $state('');
	let open = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLUListElement | null>(null);
	let activeIndex = $state(-1);

	const filtered = $derived(
		query.trim() === ''
			? allTimezones
			: allTimezones.filter((tz) => tz.search.includes(query.trim().toLowerCase()))
	);

	const selectedLabel = $derived(allTimezones.find((tz) => tz.value === value)?.label ?? value);

	function openDropdown() {
		query = '';
		open = true;
		activeIndex = filtered.findIndex((tz) => tz.value === value);
	}

	function selectOption(tz: { value: string; label: string }) {
		value = tz.value;
		open = false;
		query = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault();
				openDropdown();
			}
			return;
		}
		if (e.key === 'Escape') {
			open = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
			scrollActiveIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
			scrollActiveIntoView();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIndex >= 0 && filtered[activeIndex]) {
				selectOption(filtered[activeIndex]);
			}
		}
	}

	function scrollActiveIntoView() {
		if (!listEl) return;
		const el = listEl.querySelector(`[data-index="${activeIndex}"]`);
		el?.scrollIntoView({ block: 'nearest' });
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as Node;
		if (!inputEl?.closest('.timezone-select-wrapper')?.contains(target)) {
			open = false;
		}
	}

	$effect(() => {
		if (open) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	});

	// Reset active index when search query changes
	$effect(() => {
		if (query !== undefined) activeIndex = -1;
	});
</script>

<!-- Hidden input carries the real value for form submission -->
<input type="hidden" {name} {value} />

<div class="timezone-select-wrapper relative">
	{#if open}
		<div class="flex flex-col border border-gray-300 rounded-lg shadow-lg bg-white overflow-hidden">
			<div class="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
				<svg
					class="h-4 w-4 text-gray-400 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
					/>
				</svg>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Search timezones…"
					class="flex-1 text-sm outline-none bg-transparent"
					onkeydown={handleKeydown}
					autofocus
					autocomplete="off"
					spellcheck="false"
				/>
			</div>
			<ul bind:this={listEl} {id} role="listbox" class="max-h-52 overflow-y-auto text-sm">
				{#if filtered.length === 0}
					<li class="px-3 py-2 text-gray-400 italic">No timezones found</li>
				{:else}
					{#each filtered as tz, i (tz.value)}
						<li
							role="option"
							aria-selected={tz.value === value}
							data-index={i}
							class="cursor-pointer px-3 py-1.5 flex justify-between gap-2
								{tz.value === value ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}
								{i === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}"
							onmousedown={() => selectOption(tz)}
							onmouseenter={() => (activeIndex = i)}
						>
							<span>{tz.value.replace(/_/g, ' ')}</span>
							<span class="text-gray-400 shrink-0">{tz.label.split(' ').at(-1)}</span>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{:else}
		<button
			type="button"
			{id}
			class="input w-full text-left flex items-center justify-between gap-2"
			onclick={openDropdown}
			onkeydown={handleKeydown}
			aria-haspopup="listbox"
			aria-expanded="false"
		>
			<span class="truncate">{selectedLabel}</span>
			<svg
				class="h-4 w-4 text-gray-400 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	{/if}
</div>
