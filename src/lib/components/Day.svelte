<script>
	import { appState, settings } from '$lib/stores/periods.svelte.js';
	/** @type {{ day: string }} */
	let { day } = $props();

	const dateObj = new Date(day);
	const weekDay = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

	const isRequiredDay = $derived(settings.requiredDays.includes(weekDay));
	const hasConflict = $derived(isRequiredDay && appState[day] === 'g');

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
	{#if isRequiredDay}
		<span
			class="required-dot"
			class:conflict={hasConflict}
			title={hasConflict ? 'Wymagana obecność w biurze (wybrano pracę zdalną)' : 'Wymagana obecność w biurze'}
		></span>
	{/if}
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
		border-radius: 8px;
		transition: all 0.2s ease-in-out;
		cursor: pointer;
		overflow: hidden;
	}
	.day:hover {
		transform: translateY(-2px);
		filter: brightness(0.95);
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
	}
	.required-dot {
		position: absolute;
		top: 6px;
		left: 6px;
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background-color: rgba(0, 0, 0, 0.15);
		z-index: 10;
		transition: all 0.3s ease;
	}
	.required-dot.conflict {
		background-color: #ef4444;
		box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
		animation: pulse-dot 2s infinite ease-in-out;
	}
	@keyframes pulse-dot {
		0%, 100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.3);
			opacity: 1;
		}
	}
	.date {
		position: absolute;
		top: 2px;
		right: 2px;
		font-weight: bold;
		letter-spacing: -3px;
		font-size: 35px;
		opacity: 0.2;
		line-height: 80%;
		height: fit-content;
	}
	.txt {
		position: absolute;
		bottom: 2px;
		left: 2px;
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
