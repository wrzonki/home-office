<script>
	import { appState } from '$lib/stores/periods.svelte.js';
	import Week from '$lib/components/Week.svelte';
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
		});
		return Math.round((red / (green + red)) * 100);
	});
</script>

<header>
  <h1>Okres {index + 1}</h1>
  <h2 class:red={percent < 40} class:green={percent >= 40}>{percent}%</h2>
</header>
{#each chunkArray(period, 7) as week, index}
	<Week {week} {index} />
{/each}

<style>
  header {
    display: flex;
      gap:30px
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
