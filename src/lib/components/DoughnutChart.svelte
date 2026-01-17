<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';

  let { progress, color }: { progress: number; color: string } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  Chart.register(DoughnutController, ArcElement, Tooltip);

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [progress, 100 - progress],
            backgroundColor: [color, '#e5e7eb'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          tooltip: {
            enabled: false
          }
        }
      }
    });

    return () => {
      chart?.destroy();
    };
  });

  $effect(() => {
    if (chart) {
      chart.data.datasets[0].data = [progress, 100 - progress];
      chart.data.datasets[0].backgroundColor = [color, '#e5e7eb'];
      chart.update();
    }
  });
</script>

<div class="relative">
  <canvas bind:this={canvas}></canvas>
  <div class="absolute inset-0 flex items-center justify-center">
    <span class="text-xs font-medium text-gray-600">{Math.round(progress)}%</span>
  </div>
</div>
