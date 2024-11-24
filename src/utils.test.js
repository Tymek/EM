import { decodeFrequency } from "./utils.js";

{
	// decodeFrequency
	/** @type {Array<[string, number]>} */
	const cases = [
		["1", 1],
		["1.5", 1.5],
		["1.5e3", 1_500],
		["1.5e-3 k", 1.5],
		["1.5e+3", 1_500],
		["1.5e3Hz", 1_500],
		["1.5e3 Hz", 1_500],
		["144.050 MHz", 144_050_000],
	];

	for (const [input, expected] of cases) {
		if (decodeFrequency(input) !== expected) {
			throw new Error(
				`decodeFrequency(${input}) !== ${expected}, received ${decodeFrequency(input)}`,
			);
		}
	}
}
