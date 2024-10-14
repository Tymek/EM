import { MARGIN, WIDTH, HEIGHT, type PluginType } from "../utils";
import * as d3 from "d3";

export const frequencyAxisPlugin: PluginType = (options) => {
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

	const onUpdate = (
		newScale: d3.ScaleLogarithmic<number, number>,
		k: number,
	) => {
		axisGenerator.scale(newScale);
		axisGenerator.tickFormat((d) => {
			const format = d3.format(`.${2 + Math.floor(Math.log10(k))}~s`);
			return `${format(d)}Hz`;
		});
		axisGroup.call(axisGenerator);
	};

	return { onUpdate };
};
