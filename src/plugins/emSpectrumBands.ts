import { HEIGHT, type PluginType } from "../utils";

export const emSpectrumBandsPlugin: PluginType = (options) => {
	const { group } = options;

	const emSpectrum = [
		{ name: "Radio Waves", frequencyRange: [3, 3e9], color: "#e6194b" },
		{ name: "Microwaves", frequencyRange: [3e9, 3e11], color: "#3cb44b" },
		{ name: "IR", frequencyRange: [3e11, 4e14], color: "#ffe119" },
		{
			name: "",
			frequencyRange: [4e14, 7.5e14],
			color: "transparent",
		},
		{ name: "UV", frequencyRange: [7.5e14, 3e16], color: "#f58231" },
		{ name: "X-Rays", frequencyRange: [3e16, 3e19], color: "#911eb4" },
		{ name: "Gamma Rays", frequencyRange: [3e19, 3e24], color: "#46f0f0" },
	];

	type EMData = (typeof emSpectrum)[number];

	const onUpdate = (xScale: d3.ScaleLogarithmic<number, number>, k: number) => {
		const calculateBandX = (d: EMData) => {
			const [freqStart] = d.frequencyRange;
			return xScale(Math.max(freqStart, xScale.domain()[0]));
		};

		const calculateBandWidth = (d: EMData) => {
			const [freqStart, freqEnd] = d.frequencyRange;
			const xStart = xScale(Math.max(freqStart, xScale.domain()[0]));
			const xEnd = xScale(Math.min(freqEnd, xScale.domain()[1]));
			const width = xEnd - xStart;
			return width > 0 ? width : 0;
		};

		const calculateLabelX = (d: EMData) => {
			const [freqStart, freqEnd] = d.frequencyRange;
			const xStart = xScale(Math.max(freqStart, xScale.domain()[0]));
			const xEnd = xScale(Math.min(freqEnd, xScale.domain()[1]));
			return (xStart + xEnd) / 2;
		};

		group.selectAll(".em-band").remove();
		group.selectAll(".em-band-label").remove();

		if (k > 4) {
			return;
		}

		group
			.selectAll(".em-band")
			.data(emSpectrum)
			.enter()
			.append("rect")
			.attr("class", "em-band")
			.attr("x", calculateBandX)
			.attr("y", 0)
			.attr("width", calculateBandWidth)
			.attr("height", HEIGHT)
			.attr("fill", (d) => d.color)
			.append("title")
			.text((d) => d.name);

		group
			.selectAll(".em-band-label")
			.data(emSpectrum)
			.enter()
			.append("text")
			.attr("class", "em-band-label")
			.attr("x", calculateLabelX)
			.attr("y", HEIGHT / 2)
			.text((d) => d.name);
	};

	return { onUpdate };
};
