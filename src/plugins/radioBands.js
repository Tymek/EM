import { getDimensions, normalize } from "../utils.js";
const { d3 } = window;

/**
 * @type {import("../utils").PluginType}
 */
export const radioBandsPlugin = (options) => {
	const { group } = options;

	/**
	 * @typedef {Object} RadioData
	 * @property {string} name - The name of the radio band.
	 * @property {number[]} frequencyRange - Array representing the frequency range [start, end].
	 * @property {string} color - The color representing the band.
	 */

	/**
	 * @type {RadioData[]}
	 */
	const radioBands = [
		{ name: "VLF", frequencyRange: [3e3, 30e3], color: "#ffe4e1" }, // 3 - 30 kHz
		{ name: "LF", frequencyRange: [30e3, 300e3], color: "#ff7f50" }, // 30 - 300 kHz
		{ name: "MF", frequencyRange: [300e3, 3e6], color: "#ff6347" }, // 300 kHz - 3 MHz
		{ name: "HF", frequencyRange: [3e6, 30e6], color: "#ff4500" }, // 3 - 30 MHz
		{ name: "VHF", frequencyRange: [30e6, 300e6], color: "#ff8c00" }, // 30 - 300 MHz
		{ name: "UHF", frequencyRange: [300e6, 3e9], color: "#ffa500" }, // 300 MHz - 3 GHz
		{ name: "SHF", frequencyRange: [3e9, 30e9], color: "#ffb700" }, // 3 - 30 GHz
		{ name: "EHF", frequencyRange: [30e9, 300e9], color: "#ffd700" }, // 30 - 300 GHz
		{ name: "THF", frequencyRange: [300e9, 3e12], color: "#ffff00" }, // 300 GHz - 3 THz
	];

	/**
	 * Updates the visualization based on the given xScale and zoom level.
	 *
	 * @param {d3.ScaleLogarithmic<number, number>} xScale - D3 logarithmic scale for x-axis.
	 * @param {number} k - Zoom level.
	 */
	const onUpdate = (xScale, k) => {
		/**
		 * @param {RadioData} d - Data for the radio band.
		 * @returns {number} The x position.
		 */
		const calculateBandX = (d) => {
			const [freqStart] = d.frequencyRange;
			return xScale(Math.max(freqStart, xScale.domain()[0]));
		};

		/**
		 * @param {RadioData} d - Data for the radio band.
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
		 * @param {RadioData} d - Data for the radio band.
		 * @returns {number} The x position for the label.
		 */
		const calculateLabelX = (d) => {
			const [freqStart, freqEnd] = d.frequencyRange;
			const xStart = xScale(Math.max(freqStart, xScale.domain()[0]));
			const xEnd = xScale(Math.min(freqEnd, xScale.domain()[1]));
			return (xStart + xEnd) / 2;
		};

		// Remove any existing elements.
		group.selectAll(".radio-band").remove();
		group.selectAll(".radio-band-label").remove();

		// Restrict visualization to certain zoom levels.
		if (k < 1.5 || k > 12) {
			return;
		}

		const { height } = getDimensions();

		const interpolateOpacity = d3.interpolate(0.8, 0);
		// Add band rectangles to the visualization.
		group
			.selectAll(".radio-band")
			.data(radioBands)
			.enter()
			.append("rect")
			.attr("class", "radio-band")
			.attr("x", calculateBandX)
			.attr("y", 0)
			.attr("width", calculateBandWidth)
			.attr("height", height)
			.attr("fill", (d) => d.color)
			.attr("opacity", () => interpolateOpacity(normalize(k, 5, 12)))
			.append("title")
			.text((d) => d.name);

		if (k > 10) {
			return;
		}
		// Add labels to the visualization.
		group
			.selectAll(".radio-band-label")
			.data(radioBands)
			.enter()
			.append("text")
			.attr("class", "radio-band-label")
			.attr("x", calculateLabelX)
			.attr("y", (height * 2) / 3) // 2/3 of the height for vertical positioning
			.attr("text-anchor", "middle") // Horizontally center the text
			.attr("alignment-baseline", "middle") // Vertically align to the middle for better visual balance
			.text((d) => d.name);
	};

	return { onUpdate };
};
