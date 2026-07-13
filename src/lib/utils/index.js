/**
 * @template T
 * @param {T[]} array
 * @param {number} size
 * @returns {T[][]}
 */
export const chunkArray = (array, size) => {
	const chunks = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
};
