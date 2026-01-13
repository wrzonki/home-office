<script>
	import { onMount } from 'svelte';
	import { appState, dates } from '$lib/stores/periods.svelte.js';
	import Period from '$lib/components/Period.svelte';

	onMount(() => {
		const saved = localStorage.getItem('appState');
		if (saved) {
			try {
				Object.assign(appState, JSON.parse(saved));
			} catch {
				console.warn('Invalid appState in localStorage');
			}
		}
	});

	$effect(() => {
		localStorage.setItem('appState', JSON.stringify(appState));
	});
</script>

<div class="app">
	{#each Object.values(dates) as period, index}
		<Period {period} {index} />
	{/each}
</div>
