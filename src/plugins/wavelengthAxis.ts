import { MARGIN, WIDTH, SPEED_OF_LIGHT, type PluginType } from "../utils";
import * as d3 from "d3";

export const wavelengthAxisPlugin: PluginType = (options) => {
	const { group } = options;

	// Wavelength scale (in meters)
	const wavelengthScale = d3
		.scaleLog()
		.domain([SPEED_OF_LIGHT / 3e24, SPEED_OF_LIGHT / 3])
		.range([MARGIN.left, WIDTH - MARGIN.right]);

	const axisGroup = group.append("g").attr("class", "axis x-axis-wavelength");

	const axisGenerator = d3
		.axisTop(wavelengthScale)
		.ticks(5)
		.tickSizeOuter(0)
		.tickFormat((d) => `${d3.format(".1e")(d)} m`);

	axisGroup.call(axisGenerator);

	const onUpdate = (xScale: d3.ScaleLogarithmic<number, number>, k: number) => {
		const freqDomain = xScale.domain();
		const wavelengthDomain = [
			SPEED_OF_LIGHT / freqDomain[0],
			SPEED_OF_LIGHT / freqDomain[1],
		];
		wavelengthScale.domain(wavelengthDomain);

		axisGenerator.scale(wavelengthScale);
		axisGenerator.tickFormat((d) => {
			const format = d3.format(`.${2 + Math.floor(Math.log10(k))}~s`);
			return `${format(d)}m`;
		});
		axisGroup.call(axisGenerator);
	};

	return { onUpdate };
};
