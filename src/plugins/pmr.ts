import { HEIGHT, type PluginType } from "../utils";

// PMR Channels data (frequencies in Hz)
const numChannels = 16;
const firstChannelCenter = 446.00625e6; // Hz
const width = 12.5e3; // Hz
const spacing = 12.5e3; // Hz

const PMR_data = Array.from({ length: numChannels }, (_, i) => {
	const channel = i + 1;
	const center = firstChannelCenter + i * spacing;
	const color = channel <= 8 ? "#ff9999" : "#ffcccc";
	return { channel, center, width, color };
});

export const pmrChannelsPlugin: PluginType = (options) => {
	const { group: selection } = options;

	const group = selection.append("g").attr("class", "pmr-channels");

	const onUpdate = (xScale: d3.ScaleLogarithmic<number, number>, k: number) => {
		const visible = k >= 1000;
		group.style("display", visible ? "block" : "none");

		if (!visible) return;

		// Compute frequency ranges from center and width
		const channelsData = PMR_data.map((d) => {
			const freqStart = d.center - d.width / 2;
			const freqEnd = d.center + d.width / 2;
			return { ...d, frequencyRange: [freqStart, freqEnd] };
		});

		// Draw channel rectangles
		const channels = group
			.selectAll<SVGRectElement, (typeof channelsData)[number]>(".pmr-channel")
			.data(channelsData, (d) => d.channel);

		const channelsEnter = channels
			.enter()
			.append("rect")
			.attr("class", "pmr-channel")
			.attr("y", HEIGHT / 2)
			.attr("height", HEIGHT / 2)
			.attr("fill", (d) => d.color);

		channelsEnter
			.merge(channels)
			.attr("x", (d) => xScale(d.frequencyRange[0]))
			.attr(
				"width",
				(d) => xScale(d.frequencyRange[1]) - xScale(d.frequencyRange[0]),
			);

		channelsEnter
			.append("title")
			.merge(channels.select("title"))
			.text((d) => `PMR Channel ${d.channel}`);

		channels.exit().remove();

		// Draw channel labels
		const labels = group
			.selectAll<SVGTextElement, (typeof channelsData)[number]>(
				".pmr-channel-label",
			)
			.data(channelsData, (d) => d.channel);

		const labelsEnter = labels
			.enter()
			.append("text")
			.attr("class", "pmr-channel-label")
			.attr("y", HEIGHT - 20)
			.attr("text-anchor", "middle")
			.attr("fill", "black");

		labelsEnter
			.merge(labels)
			.attr("x", (d) => {
				const freqStart = d.frequencyRange[0];
				const freqEnd = d.frequencyRange[1];
				return (xScale(freqStart) + xScale(freqEnd)) / 2;
			})
			.text((d) => `PMR #${d.channel}`);

		labels.exit().remove();

		// Draw center frequency markers
		const markers = group
			.selectAll<SVGLineElement, (typeof channelsData)[number]>(
				".pmr-channel-marker",
			)
			.data(channelsData, (d) => d.channel);

		const markersEnter = markers
			.enter()
			.append("line")
			.attr("class", "pmr-channel-marker")
			.attr("y1", HEIGHT - 3)
			.attr("y2", HEIGHT + 20)
			.attr("stroke", "darkblue")
			.attr("stroke-width", 2);

		markersEnter
			.merge(markers)
			.attr("x1", (d) => xScale(d.center))
			.attr("x2", (d) => xScale(d.center));

		markers.exit().remove();

		// Draw center frequency labels
		const markerLabels = group
			.selectAll<SVGTextElement, (typeof channelsData)[number]>(
				".pmr-channel-marker-label",
			)
			.data(channelsData, (d) => d.channel);

		const markerLabelsEnter = markerLabels
			.enter()
			.append("text")
			.attr("y", HEIGHT + 35)
			.attr("class", "pmr-channel-marker-label")
			.attr("fill", "darkblue");

		markerLabelsEnter
			.merge(markerLabels)
			.attr("x", (d) => xScale(d.center))
			.style("font-size", "0.75em")
			.attr("transform", (d) => {
				const x = xScale(d.center);
				return `rotate(45, ${x + 10}, ${HEIGHT + 30})`;
			})
			.text((d) => `${(d.center / 1e6).toFixed(5)} MHz`);

		markerLabels.exit().remove();
	};

	return { onUpdate };
};
