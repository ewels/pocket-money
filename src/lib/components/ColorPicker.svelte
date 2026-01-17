<script lang="ts">
  import { childColors, colorHexMap, type ChildColor } from '$lib/utils';

  let { selected = $bindable('blue') }: { selected: string } = $props();
</script>

<div class="flex flex-wrap gap-2">
  {#each childColors as color}
    <button
      type="button"
      class="h-8 w-8 rounded-full ring-offset-2 transition-all {selected === color
        ? 'ring-2 ring-gray-400 scale-110'
        : 'hover:scale-105'}"
      style="background-color: {colorHexMap[color]}"
      onclick={() => (selected = color)}
      aria-label="Select {color}"
    >
      {#if selected === color}
        <svg class="h-full w-full text-white p-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      {/if}
    </button>
  {/each}
</div>
