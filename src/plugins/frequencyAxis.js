import { MARGIN, WIDTH, HEIGHT } from "../utils.js";

const { d3 } = window;

/**
 * @type {import("../utils").PluginType}
 */
export const frequencyAxisPlugin = (options) => {
	const { group } = options;

	const xScale = d3
		.scaleLog()
		.domain([3, 3e24])
		.range([MARGIN.left, WIDTH - MARGIN.right]);

	const axisGroup = group
		.append("g")
		.attr("class", "axis x-axis-frequency")
		.attr("transform", `translate(0, ${HEIGHT})`);

	const axisGenerator = d3
		.axisBottom(xScale)
		.ticks(5)
		.tickSizeOuter(0)
		.tickFormat((d) => `${d3.format(".1e")(d)} Hz`);

	axisGroup.call(axisGenerator);

	/**
	 * Updates the axis with new scale and formatting.
	 *
	 * @param {d3.ScaleLogarithmic<number, number>} newScale - New logarithmic scale for the axis.
	 * @param {number} k - Scaling factor used for tick formatting.
	 */
	const onUpdate = (newScale, k) => {
		axisGenerator.scale(newScale);
		axisGenerator.tickFormat((d) => {
			const format = d3.format(`.${2 + Math.floor(Math.log10(k))}~s`);
			return `${format(d)}Hz`;
		});
		axisGroup.call(axisGenerator);
	};

	return { onUpdate };
};
