import { HEIGHT } from "../utils.js";

/**
 * This converts a given wavelength (in nanometers)
 * within the visible spectrum into an RGB color representation.
 *
 * @param {number} wavelength - The wavelength in nanometers.
 * @returns {{r: number, g: number, b: number}} The RGB color representation.
 */
function wavelengthToRGB(wavelength) {
	let R;
	let G;
	let B;
	let alpha;

	if (wavelength >= 380 && wavelength <= 440) {
		R = (-1 * (wavelength - 440)) / (440 - 380);
		G = 0.0;
		B = 1.0;
	} else if (wavelength > 440 && wavelength <= 490) {
		R = 0.0;
		G = (wavelength - 440) / (490 - 440);
		B = 1.0;
	} else if (wavelength > 490 && wavelength <= 510) {
		R = 0.0;
		G = 1.0;
		B = (-1 * (wavelength - 510)) / (510 - 490);
	} else if (wavelength > 510 && wavelength <= 580) {
		R = (wavelength - 510) / (580 - 510);
		G = 1.0;
		B = 0.0;
	} else if (wavelength > 580 && wavelength <= 645) {
		R = 1.0;
		G = (-1 * (wavelength - 645)) / (645 - 580);
		B = 0.0;
	} else if (wavelength > 645 && wavelength <= 780) {
		R = 1.0;
		G = 0.0;
		B = 0.0;
	} else {
		R = 0.0;
		G = 0.0;
		B = 0.0;
	}

	// Intensity adjustment near vision limits
	if (wavelength >= 380 && wavelength <= 420) {
		alpha = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
	} else if (wavelength > 420 && wavelength <= 700) {
		alpha = 1.0;
	} else if (wavelength > 700 && wavelength <= 780) {
		alpha = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
	} else {
		alpha = 0.0;
	}

	R = Math.round(R * 255 * alpha);
	G = Math.round(G * 255 * alpha);
	B = Math.round(B * 255 * alpha);

	return { r: R, g: G, b: B };
}

/**
 * Converts RGB values to a hexadecimal color string.
 *
 * @param {number} r - The red component (0-255).
 * @param {number} g - The green component (0-255).
 * @param {number} b - The blue component (0-255).
 * @returns {string} The hexadecimal color string.
 */
function rgbToHex(r, g, b) {
	const toHex = (value) => {
		const hex = value.toString(16);
		return `${hex}`.padStart(2, "0");
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates gradient stops for a given frequency range.
 *
 * @param {Array<number>} [frequencyRange=[4e14, 7.5e14]] - The frequency range in Hz.
 * @param {number} [numStops=256] - The number of gradient stops.
 * @returns {Array<{offset: string, color: string}>} The gradient stops with offset and color.
 */
function generateGradientStops(
	frequencyRange = [4e14, 7.5e14],
	numStops = 256,
) {
	const C = 299_792_458; // Speed of light in m/s
	const [f_min, f_max] = frequencyRange;
	const gradientStops = [];

	for (let i = 0; i < numStops; i++) {
		const offset = i / (numStops - 1);
		const frequency = f_min + offset * (f_max - f_min);
		const wavelength_m = C / frequency; // Wavelength in meters
		const wavelength_nm = wavelength_m * 1e9; // Convert meters to nanometers

		const { r, g, b } = wavelengthToRGB(wavelength_nm);
		const hexColor = rgbToHex(r, g, b);

		gradientStops.push({
			offset: offset.toFixed(6),
			color: hexColor,
		});
	}

	return gradientStops;
}

export const visibleLightGradientStops = generateGradientStops();

/** @constant {[number, number]} */
const FREQUENCY_RANGE = [4e14, 7.5e14];

/**
 * @type {import("../utils").PluginType}
 */
export const visibleLightPlugin = (options) => {
	const { group, defs } = options;

	const gradient = defs
		.append("linearGradient")
		.attr("id", "visible-light-gradient")
		.attr("gradientUnits", "userSpaceOnUse")
		.attr("y1", 0)
		.attr("y2", 0);

	const band = group
		.append("rect")
		.attr("class", "em-visible-light")
		.attr("y", 0)
		.attr("height", HEIGHT)
		.attr("fill", "url(#visible-light-gradient)");

	for (const d of visibleLightGradientStops) {
		gradient
			.append("stop")
			.attr("offset", d.offset)
			.attr("stop-color", d.color);
	}

	/**
	 * Updates the gradient and band based on the given x-scale.
	 *
	 * @param {d3.ScaleLogarithmic<number, number>} xScale - The logarithmic scale for the x-axis.
	 */
	const onUpdate = (xScale) => {
		const xStart = xScale(Math.min(FREQUENCY_RANGE[0]));
		const xEnd = xScale(FREQUENCY_RANGE[1]);
		gradient.attr("x1", xStart).attr("x2", xEnd);
		band.attr("x", xStart).attr("width", Math.max(0, xEnd - xStart));
	};

	return { onUpdate };
};
