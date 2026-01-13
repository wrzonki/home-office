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
console.log(dates)
export const appState = $state({});

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

