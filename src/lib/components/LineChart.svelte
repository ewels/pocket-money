<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		TimeScale,
		Tooltip,
		Filler
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import { formatMoney } from '$lib/currencies';

	type BalanceEvent = { date: string; balance: number; description?: string | null };
	type UpcomingPayment = { description: string | null; amount: number; date: number };

	let {
		data,
		events = [],
		color,
		currency,
		upcomingPayments = [],
		mode = $bindable('events')
	}: {
		data: Array<{ date: string; balance: number }>;
		events: BalanceEvent[];
		color: string;
		currency: string;
		upcomingPayments: UpcomingPayment[];
		mode: 'events' | 'time';
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	Chart.register(
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		TimeScale,
		Tooltip,
		Filler
	);

	function createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
		const gradient = ctx.createLinearGradient(0, 0, 0, 200);
		gradient.addColorStop(0, color + '40');
		gradient.addColorStop(1, color + '00');
		return gradient;
	}

	function getEventLabels(evts: BalanceEvent[]): string[] {
		return evts.map((d) => {
			const date = new Date(d.date);
			return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		});
	}

	function getNextEvent(
		evts: BalanceEvent[],
		payments: UpcomingPayment[]
	): { label: string; balance: number; description: string | null } | null {
		if (payments.length === 0 || evts.length === 0) return null;
		const next = payments[0];
		const lastBalance = evts[evts.length - 1]?.balance ?? 0;
		const date = new Date(next.date * 1000);
		return {
			label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
			balance: lastBalance + next.amount,
			description: next.description
		};
	}

	function buildEventsConfig(ctx: CanvasRenderingContext2D) {
		const gradient = createGradient(ctx);
		const nextEvent = getNextEvent(events, upcomingPayments);
		const labels = getEventLabels(events);
		const balances = events.map((d) => d.balance);

		// Main dataset: all real events with fill
		const mainDataset = {
			data: [...balances],
			borderColor: color,
			backgroundColor: gradient,
			borderWidth: 2,
			fill: true,
			tension: 0,
			pointRadius: 3,
			pointBackgroundColor: color,
			pointBorderColor: color,
			pointBorderWidth: 0,
			pointHoverRadius: 5,
			pointHoverBackgroundColor: color
		};

		const datasets = [mainDataset];

		// If there's an upcoming event, add a second dataset for the dashed segment
		if (nextEvent) {
			labels.push(nextEvent.label);

			// Extend main data with NaN for the upcoming point (no line drawn)
			mainDataset.data.push(NaN);

			// Second dataset: connects last real point to upcoming point
			const upcomingData: (number | null)[] = new Array(balances.length).fill(null);
			upcomingData[balances.length - 1] = balances[balances.length - 1]; // bridge point
			upcomingData.push(nextEvent.balance);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(datasets as any[]).push({
				data: upcomingData as number[],
				borderColor: color,
				backgroundColor: 'transparent',
				borderWidth: 2,
				fill: false,
				tension: 0,
				pointRadius: upcomingData.map((v) =>
					v !== null && upcomingData.indexOf(v) === upcomingData.length - 1 ? 5 : 0
				),
				pointBackgroundColor: '#ffffff',
				pointBorderColor: color,
				pointBorderWidth: 2,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: '#ffffff',
				borderDash: [5, 5]
			});
		}

		return {
			type: 'line' as const,
			data: {
				labels,
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					tooltip: {
						callbacks: {
							title: (items: { datasetIndex: number; dataIndex: number }[]) => {
								const item = items[0];
								if (!item) return '';
								const idx = item.dataIndex;
								// Upcoming event point (second dataset, last point)
								if (item.datasetIndex === 1 && idx === labels.length - 1 && nextEvent) {
									return (nextEvent.description || nextEvent.label) + ' (upcoming)';
								}
								if (idx < events.length) {
									return events[idx]?.description || labels[idx];
								}
								return labels[idx];
							},
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							label: (ctx: any) => formatMoney(ctx.parsed?.y ?? 0, currency)
						}
					},
					legend: {
						display: false
					}
				},
				scales: {
					x: {
						type: 'category' as const,
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
							callback: (value: number | string) => formatMoney(value as number, currency),
							font: { size: 11 }
						}
					}
				},
				interaction: {
					intersect: false,
					mode: 'index' as const
				}
			}
		};
	}

	function buildTimeConfig(ctx: CanvasRenderingContext2D) {
		const gradient = createGradient(ctx);

		return {
			type: 'line' as const,
			data: {
				labels: data.map((d) => d.date),
				datasets: [
					{
						data: data.map((d) => d.balance),
						borderColor: color,
						backgroundColor: gradient,
						borderWidth: 2,
						fill: true,
						tension: 0,
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
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							label: (ctx: any) => formatMoney(ctx.parsed?.y ?? 0, currency)
						}
					}
				},
				scales: {
					x: {
						type: 'time' as const,
						time: {
							unit: 'day' as const,
							displayFormats: {
								day: 'MMM d'
							}
						},
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
							callback: (value: number | string) => formatMoney(value as number, currency),
							font: { size: 11 }
						}
					}
				},
				interaction: {
					intersect: false,
					mode: 'index' as const
				}
			}
		};
	}

	function createChart() {
		if (chart) {
			chart.destroy();
			chart = null;
		}

		const ctx = canvas?.getContext('2d');
		if (!ctx) return;

		const config = mode === 'events' ? buildEventsConfig(ctx) : buildTimeConfig(ctx);

		chart = new Chart(canvas, config);
	}

	onMount(() => {
		createChart();

		return () => {
			chart?.destroy();
		};
	});

	$effect(() => {
		// Track reactive dependencies
		void data;
		void events;
		void mode;
		void upcomingPayments;
		void color;

		// Recreate chart when mode or data changes
		if (canvas) {
			createChart();
		}
	});
</script>

<canvas bind:this={canvas}></canvas>
