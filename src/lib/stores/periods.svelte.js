/* eslint-disable svelte/prefer-svelte-reactivity */
/**
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string[]}
 */
function getDatesInRange(startDate, endDate) {
	const date = new Date(startDate);
	const end = new Date(endDate);
	const dates = [];

	while (date.getTime() <= end.getTime()) {
		dates.push(date.toISOString().slice(0, 10));
		date.setUTCDate(date.getUTCDate() + 1);
	}

	return dates;
}

const periods = {
	0: { start: '2026-01-05', end: '2026-03-29' },
	1: { start: '2026-03-30', end: '2026-06-28' },
	2: { start: '2026-06-29', end: '2026-09-27' },
	3: { start: '2026-09-28', end: '2026-12-27' }
};

export const dates = {
	0: getDatesInRange(periods[0].start, periods[0].end),
	1: getDatesInRange(periods[1].start, periods[1].end),
	2: getDatesInRange(periods[2].start, periods[2].end),
	3: getDatesInRange(periods[3].start, periods[3].end)
};
console.log(dates);
/** @type {Record<string, string>} */
export const appState = $state({});

export const settings = $state({
	requiredDays: [1, 2],
	minDays: 2,
	get requiredPercent() {
		return Math.round((this.minDays / 5) * 100);
	},
	set requiredPercent(val) {
		this.minDays = Math.round((val / 100) * 5);
	}
});

/**
 * @param {string[]} arr
 */
const setState = (arr) => {
	arr.forEach((date) => {
		const weekDay = new Date(date).getDay();
		if (weekDay === 0 || weekDay === 6) {
			appState[date] = 'b';
		} else {
			appState[date] = 'g';
		}
	});
};

setState(dates[0]);
setState(dates[1]);
setState(dates[2]);
setState(dates[3]);

export const viewState = $state({
	isReadOnly: false
});

/**
 * Serializes current state to object containing URL params.
 * @returns {{ p: string, md: number, rd: string }}
 */
export function serializeState() {
	const allDates = [...dates[0], ...dates[1], ...dates[2], ...dates[3]];
	let encodedPlan = '';
	const CHARS = 'abcdefghijklmnopqrstuvwxyz0';

	for (let i = 0; i < allDates.length; i += 3) {
		const d0 = allDates[i];
		const d1 = allDates[i + 1];
		const d2 = allDates[i + 2];

		/**
		 * @param {string | undefined} d
		 * @returns {number}
		 */
		const getVal = (d) => {
			if (!d) return 0;
			const val = appState[d];
			if (val === 'b') return 0;
			if (val === 'g') return 1;
			if (val === 'r') return 2;
			return 0;
		};

		const v0 = getVal(d0);
		const v1 = getVal(d1);
		const v2 = getVal(d2);

		const index = v0 * 9 + v1 * 3 + v2;
		encodedPlan += CHARS[index];
	}

	return {
		p: encodedPlan,
		md: settings.minDays,
		rd: settings.requiredDays.join(',')
	};
}

/**
 * Deserializes URL params and loads them into appState and settings.
 * @param {string | null} encodedPlan
 * @param {string | null} reqDaysStr
 * @param {string | null} minDaysStr
 */
export function loadSerializedState(encodedPlan, reqDaysStr, minDaysStr) {
	const allDates = [...dates[0], ...dates[1], ...dates[2], ...dates[3]];
	const CHARS = 'abcdefghijklmnopqrstuvwxyz0';

	if (encodedPlan) {
		const limit = Math.min(encodedPlan.length, Math.ceil(allDates.length / 3));
		for (let i = 0; i < limit; i++) {
			const char = encodedPlan[i];
			const index = CHARS.indexOf(char);
			if (index === -1) continue;

			const v0 = Math.floor(index / 9) % 3;
			const v1 = Math.floor(index / 3) % 3;
			const v2 = index % 3;

			const valMap = ['b', 'g', 'r'];

			const d0 = allDates[i * 3];
			const d1 = allDates[i * 3 + 1];
			const d2 = allDates[i * 3 + 2];

			if (d0) appState[d0] = valMap[v0];
			if (d1) appState[d1] = valMap[v1];
			if (d2) appState[d2] = valMap[v2];
		}
	}

	if (reqDaysStr !== undefined && reqDaysStr !== null) {
		if (reqDaysStr === '') {
			settings.requiredDays = [];
		} else {
			settings.requiredDays = reqDaysStr.split(',')
				.map(Number)
				.filter(d => !isNaN(d) && d >= 0 && d <= 6);
		}
	}

	if (minDaysStr) {
		const md = parseInt(minDaysStr, 10);
		if (!isNaN(md) && md >= 1 && md <= 5) {
			settings.minDays = md;
		}
	}
}

