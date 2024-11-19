import { getDimensions } from "../utils.js";

/**
 * @type {import("../utils").PluginType}
 */
export const emSpectrumBandsPlugin = (options) => {
	const { group } = options;

	/**
	 * @typedef {Object} EMData
	 * @property {string} name - The name of the electromagnetic band.
	 * @property {number[]} frequencyRange - Array representing the frequency range [start, end].
	 * @property {string} color - The color representing the band.
	 */

	/**
	 * @type {EMData[]}
	 */
	const emSpectrum = [
		{ name: "Radio Waves", frequencyRange: [3, 3e9], color: "#e6194b" },
		{ name: "Microwaves", frequencyRange: [3e9, 3e11], color: "#3cb44b" },
		{ name: "IR", frequencyRange: [3e11, 4e14], color: "#ffe119" },
		{ name: "", frequencyRange: [4e14, 7.5e14], color: "transparent" },
		{ name: "UV", frequencyRange: [7.5e14, 3e16], color: "#f58231" },
		{ name: "X-Rays", frequencyRange: [3e16, 3e19], color: "#911eb4" },
		{ name: "Gamma Rays", frequencyRange: [3e19, 3e24], color: "#46f0f0" },
	];

	/**
	 * Updates the visualization based on the given xScale and zoom level.
	 *
	 * @param {d3.ScaleLogarithmic<number, number>} xScale - D3 logarithmic scale for x-axis.
	 * @param {number} k - Zoom level.
	 */
	const onUpdate = (xScale, k) => {
		/**
		 * @param {EMData} d - Data for the electromagnetic band.
		 * @returns {number} The x position.
		 */
		const calculateBandX = (d) => {
			const [freqStart] = d.frequencyRange;
			return xScale(Math.max(freqStart, xScale.domain()[0]));
		};

		/**
		 * @param {EMData} d - Data for the electromagnetic band.
		 * @returns {number} The width of the band.
		 */
		const calculateBandWidth = (d) => {
			const [freqStart, freqEnd] = d.frequencyRange;
			const xStart = xScale(Math.max(freqStart, xScale.domain()[0]));
			const xEnd = xScale(Math.min(freqEnd, xScale.domain()[1]));
			const width = xEnd - xStart;
			return width > 0 ? width : 0;
		};

		/**
		 * @param {EMData} d - Data for the electromagnetic band.
		 * @returns {number} The x position for the label.
		 */
		const calculateLabelX = (d) => {
			const [freqStart, freqEnd] = d.frequencyRange;
			const xStart = xScale(Math.max(freqStart, xScale.domain()[0]));
			const xEnd = xScale(Math.min(freqEnd, xScale.domain()[1]));
			return (xStart + xEnd) / 2;
		};

		// Remove any existing elements.
		group.selectAll(".em-band").remove();
		group.selectAll(".em-band-label").remove();

		if (k > 4) {
			return;
		}

		const { height } = getDimensions();

		group
			.selectAll(".em-band")
			.data(emSpectrum)
			.enter()
			.append("rect")
			.attr("class", "em-band")
			.attr("x", calculateBandX)
			.attr("y", 0)
			.attr("width", calculateBandWidth)
			.attr("height", height)
			.attr("fill", (d) => d.color)
			.append("title")
			.text((d) => d.name);

		// Add labels to the visualization.
		group
			.selectAll(".em-band-label")
			.data(emSpectrum)
			.enter()
			.append("text")
			.attr("class", "em-band-label")
			.attr("x", calculateLabelX)
			.attr("y", height / 2)
			.text((d) => d.name);
	};

	return { onUpdate };
};
