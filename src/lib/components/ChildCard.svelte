<script lang="ts">
  import { getInitials, colorHexMap, calculateProgress, type ChildColor } from '$lib/utils';
  import { formatMoney } from '$lib/currencies';
  import DoughnutChart from './DoughnutChart.svelte';

  type Child = {
    id: string;
    name: string;
    color: string;
    photo_url: string | null;
    photo_data: string | null;
    balance: number;
    targets: Array<{
      id: string;
      name: string;
      target_amount: number;
    }>;
  };

  let { child, currency }: { child: Child; currency: string } = $props();

  const colorClass = `bg-child-${child.color}` as const;
</script>

<a href="/child/{child.id}" class="card hover:shadow-md transition-shadow">
  <div class="p-6">
    <div class="flex items-center gap-4">
      {#if child.photo_data}
        <img
          src={child.photo_data}
          alt={child.name}
          class="h-16 w-16 rounded-full object-cover ring-4 ring-child-{child.color}/20"
        />
      {:else}
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white {colorClass}"
        >
          {getInitials(child.name)}
        </div>
      {/if}
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 truncate">{child.name}</h3>
        <p class="text-2xl font-bold text-child-{child.color}">
          {formatMoney(child.balance, currency)}
        </p>
      </div>
    </div>

    {#if child.targets.length > 0}
      <div class="mt-4 flex justify-center gap-6">
        {#each child.targets as target (target.id)}
          <div class="text-center">
            <div class="w-16 h-16">
              <DoughnutChart
                progress={calculateProgress(child.balance, target.target_amount)}
                color={colorHexMap[child.color as ChildColor] ?? colorHexMap.blue}
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 truncate max-w-[64px]" title={target.name}>
              {target.name}
            </p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</a>
