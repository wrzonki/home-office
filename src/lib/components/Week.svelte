<script>
	import Day from '$lib/components/Day.svelte';
	/** @type {{ week: string[], index: number, balance: number }} */
	let { week, index, balance } = $props();
</script>

<div class="week">
	<div class="percent" class:red={balance < 0} class:gray={balance === 0} class:green={balance > 0}>
		{index + 1}
	</div>
	{#each week as day (day)}
		<Day {day} />
	{/each}
	<div class="percent" class:red={balance < 0} class:gray={balance === 0} class:green={balance > 0}>
		{balance > 0 ? `+${balance}` : balance}
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
	.gray {
		color: #94a3b8;
	}
</style>
