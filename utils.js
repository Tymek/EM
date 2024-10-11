export const MARGIN = { top: 50, right: 12, bottom: 50, left: 12 };
export const WIDTH = window.innerWidth - MARGIN.left - MARGIN.right;
export const HEIGHT = 250 - MARGIN.top - MARGIN.bottom;
export const SPEED_OF_LIGHT = 299_792_458; // m/s

export function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

function encodeFrequency(freq) {
	const prefixes = [
		{ value: 1e24, symbol: "Y" },
		{ value: 1e21, symbol: "Z" },
		{ value: 1e18, symbol: "E" },
		{ value: 1e15, symbol: "P" },
		{ value: 1e12, symbol: "T" },
		{ value: 1e9, symbol: "G" },
		{ value: 1e6, symbol: "M" },
		{ value: 1e3, symbol: "k" },
	];
	for (let i = 0; i < prefixes.length; i++) {
		if (freq >= prefixes[i].value) {
			const value = freq / prefixes[i].value;
			const formattedValue = value.toFixed(3);
			return `${formattedValue}${prefixes[i].symbol}`;
		}
	}
	return freq.toFixed(3);
}

function decodeFrequency(str) {
	const prefixes = {
		Y: 1e24,
		Z: 1e21,
		E: 1e18,
		P: 1e15,
		T: 1e12,
		G: 1e9,
		M: 1e6,
		k: 1e3,
		"": 1,
	};
	const match = str.match(/^([\d.]+)([a-zA-Z]*)$/);
	if (match) {
		const value = Number.parseFloat(match[1]);
		const prefix = match[2];
		const multiplier = prefixes[prefix];
		if (multiplier !== undefined) {
			return value * multiplier;
		}
	}
	return Number.NaN;
}

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

export function updateURLWithFrequencies([startFreq, endFreq]) {
	const params = new URLSearchParams(window.location.search);
	params.set("start", encodeFrequency(startFreq));
	params.set("end", encodeFrequency(endFreq));
	const newURL = `${window.location.pathname}?${params.toString()}`;
	window.history.replaceState({}, "", newURL);
}
