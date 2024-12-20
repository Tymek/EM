import { MARGIN, C, getDimensions, getEventBus } from "../utils.js";

const { d3 } = window;

/**
 * @type {import("../utils").PluginType}
 */
export const wavelengthAxisPlugin = (options) => {
	const { group } = options;
	const { width } = getDimensions();

	// Wavelength scale (in meters)
	const wavelengthScale = d3
		.scaleLog()
		.domain([C / 3e24, C / 3])
		.range([MARGIN.left, width - MARGIN.right]);

	// Create and append the axis group
	const axisGroup = group.append("g").attr("class", "axis x-axis-wavelength");

	// Axis generator for the wavelength axis
	const axisGenerator = d3
		.axisTop(wavelengthScale)
		.ticks(5)
		.tickSizeOuter(0)
		.tickFormat((d) => `${d3.format(".1e")(d)} m`);

	// Apply the axis to the group
	axisGroup.call(axisGenerator);

	let speedOfLight = /** @type number */ (C);
	let lastScale = null;
	let lastK = 1;

	/**
	 * Updates the wavelength axis based on the provided frequency domain.
	 *
	 * @param {d3.ScaleLogarithmic} xScale - Logarithmic scale for the x-axis.
	 * @param {number} k - Scaling factor used to adjust tick formatting.
	 */
	const onUpdate = (xScale, k) => {
		lastScale = xScale;
		lastK = k;
		const freqDomain = xScale.domain();
		const wavelengthDomain = [
			speedOfLight / freqDomain[0],
			speedOfLight / freqDomain[1],
		];
		wavelengthScale.domain(wavelengthDomain);

		axisGenerator.scale(wavelengthScale);
		axisGenerator.tickFormat((d) => {
			const format = d3.format(`.${2 + Math.floor(Math.log10(k))}~s`);
			return `${format(d)}m`;
		});
		axisGroup.call(axisGenerator);
	};

	getEventBus().on("velocityFactor", ({ speedOfLight: v }) => {
		requestAnimationFrame(() => {
			speedOfLight = v;
			onUpdate(lastScale, lastK);
		});
	});

	return { onUpdate };
};
