/** @const @type {{top: number, right: number, bottom: number, left: number}} */
export const MARGIN = { top: 50, right: 0, bottom: 50, left: 0 };
/** @const @type {number} */
export const LEGEND_HEIGHT = 200;
/** @const @type {299792458} Speed of light in vacuum */
export const C = 299_792_458; // m/s
/** @const @type {[3, 3e24]} Define the frequency domain (from planet to quantum scale) */
export const DOMAIN = [3, 3e24]; // Full frequency range

export const getDimensions = () => {
	const width = window.innerWidth - MARGIN.left - MARGIN.right;
	const height = 250 - MARGIN.top - MARGIN.bottom;
	return { width, height };
};

/**
 * @typedef {function(Object): { onUpdate: function(d3.ScaleLogarithmic, number): void, onResize?: function(): void }} PluginType
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

/**
 * @template {Function} F
 * @param {F} func - The function to throttle
 * @param {number} waitFor - The number of milliseconds to delay
 * @returns {(...args: Parameters<F>) => void} - A throttled version of the function
 */
export function throttle(func, waitFor) {
	let timeout;
	let lastArgs;

	return (...args) => {
		lastArgs = args;
		if (!timeout) {
			timeout = setTimeout(() => {
				func(...lastArgs);
				timeout = null;
			}, waitFor);
		}
	};
}

/** @const */
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
export function encodeFrequency(freq) {
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
export function decodeFrequency(str) {
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
 * @param {number} velocityFactor - The velocity of propagation of light, or 100 if default.
 */
export function updateURLWithVelocityFactor(velocityFactor) {
	const params = new URLSearchParams(window.location.search);

	if (velocityFactor >= 100 || velocityFactor <= 0) {
		params.delete("vf");
	} else {
		params.set("vf", `${velocityFactor.toString().replace(/^0/, "")}`);
	}

	const paramsString = params.toString();
	const newURL = `${window.location.pathname}${paramsString ? `?${paramsString}` : ""}`;
	window.history.replaceState({}, "", newURL);
}

/**
 * @returns {number} >0 and ≤100
 */
export function getVelocityFactorFromURL() {
	const params = new URLSearchParams(window.location.search);
	const velocityFactorStr = params.get("vf");
	if (velocityFactorStr !== null) {
		const velocityFactor = Number.parseFloat(velocityFactorStr);
		if (
			!Number.isNaN(velocityFactor) &&
			velocityFactor <= 100 &&
			velocityFactor > 0
		) {
			return velocityFactor;
		}
	}
	return 100;
}

/**
 * @param {string | string[]} param - The URL parameters to listen to. If [], listen to all.
 * @param {function(URLSearchParams): void} callback
 */
export function listenToURLChanges(param, callback) {
	let state = new URLSearchParams(window.location.search);
	const params = Array.isArray(param) ? param : [param];
	window.addEventListener("hashchange", (event) => {
		const newState = new URLSearchParams(window.location.search);
		if (
			params.length === 0 ||
			params.some((param) => state.get(param) !== newState.get(param))
		) {
			state = newState;
			callback(newState);
		}
	});
}

/**
 * Normalizes a value between a given range [min, max].
 *
 * @param {number} value - The value to be normalized.
 * @param {number} min - The minimum of the range.
 * @param {number} max - The maximum of the range.
 * @returns {number} - The normalized value between 0 and 1.
 */
export function normalize(value, min, max) {
	if (min === max) {
		throw new Error("Min and max cannot be the same value");
	}
	return (value - min) / (max - min);
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

/**
 * @typedef {Object} EventTypes
 * @property {Object} velocityFactor
 * @property {number} velocityFactor.velocityFactor
 * @property {number} velocityFactor.speedOfLight
 */

/**
 * @returns {{
 *   on: <K extends keyof EventTypes>(
 *     event: K,
 *     callback: (data: EventTypes[K]) => void
 *   ) => ReturnType<typeof createEventBus>,
 *   emit: <K extends keyof EventTypes>(
 *     event: K,
 *     data: EventTypes[K]
 *   ) => ReturnType<typeof createEventBus>,
 *   off: <K extends keyof EventTypes>(
 *     event: K,
 *     callback?: (data: EventTypes[K]) => void
 *   ) => ReturnType<typeof createEventBus>
 * }}
 */
function createEventBus() {
	/** @type {Map<keyof EventTypes, Function[]>} */
	const listeners = new Map();

	/** @type {Object} */
	const eventBus = {
		/**
		 * Register an event listener with type-safe callback
		 * @template {keyof EventTypes} K
		 * @param {K} event - The event name
		 * @param {(data: EventTypes[K]) => void} callback - The callback function
		 */
		on(event, callback) {
			if (!listeners.has(event)) {
				listeners.set(event, []);
			}
			listeners.get(event).push(callback);
		},

		/**
		 * Emit an event with type-safe data
		 * @template {keyof EventTypes} K
		 * @param {K} event - The event name
		 * @param {EventTypes[K]} data - The event data
		 */
		emit(event, data) {
			if (listeners.has(event)) {
				for (const callback of listeners.get(event)) {
					callback(data);
				}
			}
		},

		/**
		 * Remove event listener(s) with type-safe callback
		 * @template {keyof EventTypes} K
		 * @param {K} event - The event name
		 * @param {(data: EventTypes[K]) => void} [callback] - Optional specific callback to remove
		 * @returns {ReturnType<typeof createEventBus>}
		 */
		off(event, callback) {
			const eventListeners = listeners.get(event);
			if (eventListeners) {
				if (callback) {
					const index = eventListeners.indexOf(callback);
					if (index !== -1) {
						eventListeners.splice(index, 1);
					}
				} else {
					listeners.delete(event);
				}
			}
			return eventBus;
		},
	};

	return eventBus;
}

const eventBus = createEventBus();

// @ts-expect-error
window.emAppEventBus = eventBus;

/**
 * @returns {typeof eventBus}
 */
export const getEventBus = () =>
	// @ts-expect-error
	window.emAppEventBus;
