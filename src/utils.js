/** @const @type {{top: number, right: number, bottom: number, left: number}} */
export const MARGIN = { top: 50, right: 0, bottom: 50, left: 0 };
/** @const @type {number} */
export const WIDTH = window.innerWidth - MARGIN.left - MARGIN.right;
/** @const @type {number} */
export const HEIGHT = 250 - MARGIN.top - MARGIN.bottom;
/** @const @type {number} */
export const LEGEND_HEIGHT = 200;
/** @const @type {299792458} */
export const SPEED_OF_LIGHT = 299_792_458; // m/s

/**
 * @typedef {function(Object): { onUpdate: function(d3.ScaleLogarithmic, number): void }} PluginType
 * @property {d3.Selection<SVGGElement, unknown, HTMLElement, unknown>} options.group - Group selection.
 * @property {d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>} options.defs - Defs selection.
 */

/**
 * @template {Function} F
 * @param {F} func - The function to debounce
 * @param {number} waitFor - The number of milliseconds to delay
 * @returns {(...args: Parameters<F>) => void} - A debounced version of the function
 */
export function debounce(func, waitFor) {
	let timeout;

	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), waitFor);
	};
}

const SI_PREFIXES = [
	{ value: 1e24, symbol: "Y" },
	{ value: 1e21, symbol: "Z" },
	{ value: 1e18, symbol: "E" },
	{ value: 1e15, symbol: "P" },
	{ value: 1e12, symbol: "T" },
	{ value: 1e9, symbol: "G" },
	{ value: 1e6, symbol: "M" },
	{ value: 1e3, symbol: "k" },
	{ value: 1, symbol: "" },
];

/**
 * @param {number} freq - The frequency value to encode.
 * @returns {string} - The encoded frequency string.
 */
function encodeFrequency(freq) {
	for (let i = 0; i < SI_PREFIXES.length; i++) {
		if (freq >= SI_PREFIXES[i].value) {
			const value = freq / SI_PREFIXES[i].value;
			const formattedValue = value.toFixed(3);
			return `${formattedValue}${SI_PREFIXES[i].symbol}`;
		}
	}
	return freq.toFixed(3);
}

/**
 * @param {string} str - The frequency string to decode.
 * @returns {number} - The decoded frequency value.
 */
function decodeFrequency(str) {
	let i = 0;
	while ((i < str.length && !Number.isNaN(Number(str[i]))) || str[i] === ".") {
		i++;
	}

	const value = Number.parseFloat(str.slice(0, i));
	const prefix = str.slice(i);
	const multiplier =
		SI_PREFIXES.find((p) => p.symbol === prefix)?.value ?? Number.NaN;

	return value * multiplier;
}

/**
 * @returns {?number[]} - The start and end frequency values, or null if not available.
 */
export function getFrequenciesFromURL() {
	const params = new URLSearchParams(window.location.search);
	const startFreqStr = params.get("start");
	const endFreqStr = params.get("end");
	if (startFreqStr !== null && endFreqStr !== null) {
		const startFreq = decodeFrequency(startFreqStr);
		const endFreq = decodeFrequency(endFreqStr);
		if (!Number.isNaN(startFreq) && !Number.isNaN(endFreq)) {
			return [startFreq, endFreq];
		}
	}
	return null;
}

/**
 * @param {[number, number]} frequencies - The start and end frequencies.
 * @param {[number, number]} limits - The min and max frequency limits.
 */
export function updateURLWithFrequencies([start, end], [min, max]) {
	const startFreq = encodeFrequency(start);
	const endFreq = encodeFrequency(end);
	const minFreq = encodeFrequency(min);
	const maxFreq = encodeFrequency(max);
	const params = new URLSearchParams(window.location.search);

	if (startFreq === minFreq && endFreq === maxFreq) {
		params.delete("start");
		params.delete("end");
	} else {
		params.set("start", startFreq);
		params.set("end", endFreq);
	}

	const paramsString = params.toString();
	const newURL = `${window.location.pathname}${paramsString ? `?${paramsString}` : ""}`;
	window.history.replaceState({}, "", newURL);
}

/**
 * Loads an HTML component from a specified URL and processes it.
 *
 * @param {string} url - The URL of the component to load, relative to the /src/components/ directory.
 */
export const loadComponent = (url) =>
	fetch(url)
		.then((response) => response.text())
		.then((data) => {
			const range = document.createRange();
			const fragment = range.createContextualFragment(data);
			return fragment;
		});
