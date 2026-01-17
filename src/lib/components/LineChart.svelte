<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
  import { formatMoney } from '$lib/currencies';

  let {
    data,
    color,
    currency
  }: { data: Array<{ date: string; balance: number }>; color: string; currency: string } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            data: data.map((d) => d.balance),
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: color
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => formatMoney(ctx.parsed.y ?? 0, currency)
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 7,
              font: { size: 11 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            ticks: {
              callback: (value) => formatMoney(value as number, currency),
              font: { size: 11 }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    return () => {
      chart?.destroy();
    };
  });

  $effect(() => {
    if (chart) {
      chart.data.labels = data.map((d) => {
        const date = new Date(d.date);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });
      chart.data.datasets[0].data = data.map((d) => d.balance);
      chart.update();
    }
  });
</script>

<canvas bind:this={canvas}></canvas>
