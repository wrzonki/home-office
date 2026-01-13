<script>
	import { appState } from '$lib/stores/periods.svelte.js';
	let { day } = $props();
	const changeColor = () => {
		if (appState[day] === 'b') {
			appState[day] = 'g';
		} else if (appState[day] === 'g') {
			appState[day] = 'r';
		} else if (appState[day] === 'r') {
			appState[day] = 'b';
		}
	};
</script>

<div
	onclick={changeColor}
	class="day"
	class:blue={appState[day] === 'b'}
	class:green={appState[day] === 'g'}
	class:red={appState[day] === 'r'}
>
	<div class="date">
		{Intl.DateTimeFormat('pl', {
			month: 'numeric',
			day: 'numeric'
		}).format(new Date(day))}
	</div>
	<div class="txt">
		{#if appState[day] === 'b'}Wolne{/if}
		{#if appState[day] === 'g'}Zdalne{/if}
		{#if appState[day] === 'r'}Biuro{/if}
	</div>
</div>

<style>
	.day {
		min-width: 80px;
		min-height: 80px;
		position: relative;
		user-select: none;
		margin: 5px;
	}
	.date {
		position: absolute;
		top: 0;
		right: 0;
		font-weight: bold;
		letter-spacing: -3px;
		font-size: 35px;
		opacity: 0.2;
		line-height: 80%;
		height: fit-content;
	}
	.txt {
		position: absolute;
		bottom: 5px;
		left: 0;
		font-weight: bold;
		letter-spacing: -3px;
		font-size: 25px;
		opacity: 0.2;
		line-height: 80%;
		height: fit-content;
	}
	.blue {
		background: #aedefc;
	}
	.green {
		background: #a8df8e;
	}
	.red {
		background: #ffd8df;
	}
</style>
