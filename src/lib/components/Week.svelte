<script>
	import { appState, settings } from '$lib/stores/periods.svelte.js';
	import Day from '$lib/components/Day.svelte';
	/** @type {{ week: string[], index: number }} */
	let { week, index } = $props();
	let percent = $derived.by(() => {
		let green = 0;
		let red = 0;
		week.forEach((day) => {
			if (appState[day] === 'g') {
				green++;
			}
			if (appState[day] === 'r') {
				red++;
			}
			if (appState[day] === 'b') {
				const dateObj = new Date(day);
				const weekDay = dateObj.getDay();
				if (settings.requiredDays.includes(weekDay)) {
					red++;
				}
			}
		});
		if (red === 0 || red + green === 0) {
			return 0;
		}
		return Math.round((red / (green + red)) * 100);
	});
</script>

<div class="week">
	<div class="percent" class:red={percent < settings.requiredPercent} class:green={percent >= settings.requiredPercent}>
		{index + 1}
	</div>
	{#each week as day (day)}
		<Day {day} />
	{/each}
	<div class="percent" class:red={percent < settings.requiredPercent} class:green={percent >= settings.requiredPercent}>
		{percent}%
	</div>
</div>

<style>
	.week {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
	}
	.percent {
		margin: 0 10px;
		min-width: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30px;
		font-weight: bold;
		opacity: 1;
	}
	.green {
		color: #a8df8e;
	}
	.red {
		color: #ffd8df;
	}
</style>
