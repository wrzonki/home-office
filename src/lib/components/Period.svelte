<script>
	import { appState, settings } from '$lib/stores/periods.svelte.js';
	import Week from '$lib/components/Week.svelte';
	/** @type {{ period: string[], index: number }} */
	let { period, index } = $props();
	import { chunkArray } from '$lib/utils';

	let percent = $derived.by(() => {
		let green = 0;
		let red = 0;
		period.flat().forEach((day) => {
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
	let weeks = $derived(chunkArray(period, 7));

	let weekBalances = $derived.by(() => {
		let runningBalance = 0;
		return weeks.map((week) => {
			let actualOfficeDays = 0;
			week.forEach((day) => {
				if (appState[day] === 'r') {
					actualOfficeDays++;
				} else if (appState[day] === 'b') {
					const dateObj = new Date(day);
					const weekDay = dateObj.getDay();
					if (settings.requiredDays.includes(weekDay)) {
						actualOfficeDays++;
					}
				}
			});
			const requiredDays = settings.minDays;
			runningBalance += (actualOfficeDays - requiredDays);
			return runningBalance;
		});
	});

	let isPeriodRequirementMet = $derived(
		weekBalances.length > 0 && weekBalances[weekBalances.length - 1] >= 0
	);

	let totalOfficeDays = $derived.by(() => {
		let count = 0;
		period.flat().forEach((day) => {
			if (appState[day] === 'r') {
				count++;
			} else if (appState[day] === 'b') {
				const dateObj = new Date(day);
				const weekDay = dateObj.getDay();
				if (settings.requiredDays.includes(weekDay)) {
					count++;
				}
			}
		});
		return count;
	});

	let totalRequiredDays = $derived(weeks.length * settings.minDays);
</script>

<header>
	<h1>Okres {index + 1}</h1>
	<h2 class:red={!isPeriodRequirementMet} class:green={isPeriodRequirementMet}>
		{percent}% ({totalOfficeDays} / {totalRequiredDays})
	</h2>
</header>
{#each weeks as week, weekIndex (weekIndex)}
	<Week {week} index={weekIndex} balance={weekBalances[weekIndex]} />
{/each}

<style>
	header {
		display: flex;
		gap: 30px;
	}
	h1 {
		width: fit-content;
		display: block;
		font-size: 50px;
		font-weight: bold;
		color: #aedefc;
	}
	h2 {
		width: fit-content;
		display: block;
		font-size: 50px;
		font-weight: bold;
	}
	.green {
		color: #a8df8e;
	}
	.red {
		color: #ffd8df;
	}
</style>
