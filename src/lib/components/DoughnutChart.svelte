<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';

	type Target = {
		id: string;
		name: string;
		target_amount: number;
	};

	let { targets, balance, color }: { targets: Target[]; balance: number; color: string } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	Chart.register(DoughnutController, ArcElement, Tooltip);

	/**
	 * Build chart.js data arrays for a multi-target segmented donut.
	 *
	 * Each target occupies an arc proportional to its target_amount.
	 * Between targets, a small transparent gap segment is inserted.
	 * Within each target's arc, filled (colored) vs unfilled (gray) is shown.
	 */
	function buildDataset(
		targets: Target[],
		balance: number,
		color: string
	): { data: number[]; backgroundColor: string[] } {
		if (targets.length === 0) {
			return { data: [100], backgroundColor: ['#e5e7eb'] };
		}

		const totalAmount = targets.reduce((sum, t) => sum + t.target_amount, 0);
		if (totalAmount <= 0) {
			return { data: [100], backgroundColor: ['#e5e7eb'] };
		}

		// Gap in data units: represents ~2px on the ring.
		// The ring's mid-radius ≈ 0.85 * r (at cutout 70%, ring occupies 70%-100% of r).
		// For a 48px chart: r ≈ 24px, mid-radius ≈ 0.85 * 24 ≈ 20px.
		// Circumference at mid-radius ≈ 2π * 20 ≈ 126px.
		// 2px gap as fraction of circumference: 2 / 126 ≈ 0.016.
		// Each gap reserves a fixed fraction of total arc, so gaps stay ~2px regardless of target count.
		const numGaps = targets.length - 1;
		const gapFraction = 0.018; // fraction of totalAmount per gap
		const gapValue = totalAmount * gapFraction; // fixed per-gap size
		const totalGap = gapValue * numGaps;

		// Available arc for actual target data
		const availableAmount = totalAmount - totalGap;

		const data: number[] = [];
		const backgroundColor: string[] = [];

		let remainingBalance = balance;

		targets.forEach((target, i) => {
			// Scale target arc proportionally, minus its share of the gap overhead
			const targetArc = (target.target_amount / totalAmount) * availableAmount;

			if (remainingBalance >= target.target_amount) {
				// Fully completed target: entire arc is filled
				data.push(targetArc);
				backgroundColor.push(color);
				remainingBalance -= target.target_amount;
			} else if (remainingBalance > 0) {
				// Partially completed: split arc into filled + unfilled
				const filledFraction = remainingBalance / target.target_amount;
				const filledArc = targetArc * filledFraction;
				const unfilledArc = targetArc * (1 - filledFraction);
				data.push(filledArc, unfilledArc);
				backgroundColor.push(color, '#e5e7eb');
				remainingBalance = 0;
			} else {
				// Not started: entire arc is unfilled
				data.push(targetArc);
				backgroundColor.push('#e5e7eb');
			}

			// Add gap after each target except the last
			if (i < targets.length - 1) {
				data.push(gapValue);
				backgroundColor.push('transparent');
			}
		});

		return { data, backgroundColor };
	}

	onMount(() => {
		const { data, backgroundColor } = buildDataset(targets, balance, color);

		chart = new Chart(canvas, {
			type: 'doughnut',
			data: {
				datasets: [
					{
						data,
						backgroundColor,
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
			const { data, backgroundColor } = buildDataset(targets, balance, color);
			chart.data.datasets[0].data = data;
			chart.data.datasets[0].backgroundColor = backgroundColor;
			chart.update();
		}
	});
</script>

<canvas bind:this={canvas}></canvas>
