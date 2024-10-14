export const MARGIN = { top: 50, right: 12, bottom: 50, left: 12 };
export const WIDTH = window.innerWidth - MARGIN.left - MARGIN.right;
export const HEIGHT = 250 - MARGIN.top - MARGIN.bottom;
export const LEGEND_HEIGHT = 200;
export const SPEED_OF_LIGHT = 299_792_458 as const; // m/s

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
	func: F,
	waitFor: number,
): (...args: Parameters<F>) => void {
	let timeout: ReturnType<typeof setTimeout>;

	return (...args: Parameters<F>): void => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), waitFor);
	};
}

function encodeFrequency(freq: number): string {
	const prefixes = [
		{ value: 1e24, symbol: "Y" },
		{ value: 1e21, symbol: "Z" },
		{ value: 1e18, symbol: "E" },
		{ value: 1e15, symbol: "P" },
		{ value: 1e12, symbol: "T" },
		{ value: 1e9, symbol: "G" },
		{ value: 1e6, symbol: "M" },
		{ value: 1e3, symbol: "k" },
	] as const;
	for (let i = 0; i < prefixes.length; i++) {
		if (freq >= prefixes[i].value) {
			const value = freq / prefixes[i].value;
			const formattedValue = value.toFixed(3);
			return `${formattedValue}${prefixes[i].symbol}`;
		}
	}
	return freq.toFixed(3);
}

function decodeFrequency(str: string): number {
	const prefixes: { [key: string]: number } = {
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

	let i = 0;
	while ((i < str.length && !Number.isNaN(Number(str[i]))) || str[i] === ".") {
		i++;
	}

	const value = Number.parseFloat(str.slice(0, i));
	const prefix = str.slice(i);
	const multiplier = prefixes[prefix] ?? Number.NaN;

	return value * multiplier;
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

export function updateURLWithFrequencies([startFreq, endFreq]: number[]) {
	const params = new URLSearchParams(window.location.search);
	params.set("start", encodeFrequency(startFreq));
	params.set("end", encodeFrequency(endFreq));
	const newURL = `${window.location.pathname}?${params.toString()}`;
	window.history.replaceState({}, "", newURL);
}

export type PluginType = (options: {
	group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
	defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>;
}) => {
	onUpdate: (xScale: d3.ScaleLogarithmic<number, number>, k: number) => void;
};
