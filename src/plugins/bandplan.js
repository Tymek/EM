import { HEIGHT } from "../utils.js";

/**
 * @typedef {Object} BandData
 * @property {string} band
 * @property {number} start
 * @property {number} end
 * @property {string} color
 */

/**
 * @typedef {(value: number) => number} XScale
 */

/** @type {Array<BandData>} */
const IARU_band_data = [
	{ band: "2200m", start: 135700, end: 137800, color: "#ffb3b3" },
	{ band: "630m", start: 472000, end: 479000, color: "#ff9999" },
	{ band: "160m", start: 1810000, end: 2000000, color: "#ffcccc" },
	{ band: "80m", start: 3500000, end: 3800000, color: "#ff9999" },
	{ band: "60m", start: 5351500, end: 5366500, color: "#ff8080" },
	{ band: "40m", start: 7000000, end: 7200000, color: "#ff6666" },
	{ band: "30m", start: 10100000, end: 10150000, color: "#ff4d4d" },
	{ band: "20m", start: 14000000, end: 14350000, color: "#ff3333" },
	{ band: "17m", start: 18068000, end: 18168000, color: "#ff1a1a" },
	{ band: "15m", start: 21000000, end: 21450000, color: "#ff0000" },
	{ band: "12m", start: 24890000, end: 24990000, color: "#e60000" },
	{ band: "10m", start: 28000000, end: 29700000, color: "#cc0000" },
	{ band: "6m", start: 50000000, end: 52000000, color: "#990000" },
	{ band: "4m", start: 70000000, end: 70500000, color: "#800000" },
	{ band: "2m", start: 144000000, end: 146000000, color: "#660000" },
	{ band: "70cm", start: 430000000, end: 440000000, color: "#330000" },
	{ band: "23cm", start: 1240000000, end: 1300000000, color: "#000033" },
	{ band: "13cm", start: 2300000000, end: 2450000000, color: "#000066" },
	{ band: "9cm", start: 3400000000, end: 3475000000, color: "#000099" },
	{ band: "6cm", start: 5650000000, end: 5850000000, color: "#0000cc" },
	{ band: "3cm", start: 10000000000, end: 10500000000, color: "#0000ff" },
	{ band: "12mm", start: 24000000000, end: 24250000000, color: "#3333ff" },
	{ band: "6mm", start: 47000000000, end: 47200000000, color: "#0033ff" },
	{ band: "4mm", start: 75500000000, end: 81500000000, color: "#3366ff" },
	{ band: "2mm", start: 134000000000, end: 136000000000, color: "#99ccff" },
	{ band: "<2mm", start: 241000000000, end: 250000000000, color: "#ccffff" },
];

/**
 * @type {import("../utils").PluginType}
 */
export const bandplanPlugin = (options) => {
	const { group: selection } = options;

	const group = selection.append("g").attr("class", "iaru-bands");

	/**
	 * Draws markers on the chart.
	 * @param {d3.Selection} selection
	 * @param {string} className
	 * @param {number} y1
	 * @param {number} y2
	 * @param {string} color
	 * @param {(d: BandData) => number} xFunc
	 */
	const drawMarkers = (selection, className, y1, y2, color, xFunc) => {
		/** @type {d3.Selection<SVGLineElement, BandData, SVGGElement, unknown>} */
		const markers = /** @type {any} */ (
			selection.selectAll(`.${className}`).data(IARU_band_data, (d) => d.band)
		);

		const markersEnter = markers
			.enter()
			.append("line")
			.attr("class", className)
			.attr("y1", y1)
			.attr("y2", y2)
			.attr("stroke", color)
			.attr("stroke-width", 2);

		markersEnter.merge(markers).attr("x1", xFunc).attr("x2", xFunc);

		markers.exit().remove();
	};

	/**
	 * Draws labels on the chart.
	 * @param {d3.Selection<SVGGElement, unknown, HTMLElement, unknown>} selection
	 * @param {string} className
	 * @param {number} y
	 * @param {string} fill
	 * @param {(d: BandData) => number} xFunc
	 * @param {(d: BandData) => string} textFunc
	 * @param {boolean} [rotate=false]
	 */
	const drawLabels = (
		selection,
		className,
		y,
		fill,
		xFunc,
		textFunc,
		rotate = false,
	) => {
		/** @type {d3.Selection<SVGTextElement, BandData, SVGGElement, unknown>} */
		const labels = /** @type {any} */ (
			selection.selectAll(`.${className}`).data(IARU_band_data, (d) => d.band)
		);

		const labelsEnter = labels
			.enter()
			.append("text")
			.attr("class", className)
			.attr("y", y)
			.attr("text-anchor", "middle")
			.attr("fill", fill);

		labelsEnter
			.merge(labels)
			.attr("x", xFunc)
			.text(textFunc)
			.attr("font-size", "0.75em");

		if (rotate) {
			labelsEnter.merge(labels).attr("transform", (d) => {
				const x = xFunc(d);
				return `rotate(45, ${x - 10}, ${y + 25})`;
			});
		}

		labels.exit().remove();
	};

	/**
	 * Updates the chart with new scaling and zoom level.
	 * @param {XScale} xScale
	 * @param {number} k
	 */
	const onUpdate = (xScale, k) => {
		const visible = k >= 3;
		group.style("display", visible ? "block" : "none");

		if (!visible) return;

		/** @type {d3.Selection<SVGRectElement, BandData, SVGGElement, unknown>} */
		const bands = /** @type {any} */ (
			group.selectAll(".iaru-band").data(IARU_band_data, (d) => d.band)
		);

		const bandsEnter = bands
			.enter()
			.append("rect")
			.attr("class", "iaru-band")
			.attr("y", HEIGHT / 2)
			.attr("height", HEIGHT / 2)
			.attr("fill", (d) => d.color);

		bandsEnter
			.merge(bands)
			.attr("x", (d) => xScale(d.start))
			.attr("width", (d) => xScale(d.end) - xScale(d.start));

		bandsEnter
			.append("title")
			.merge(bands.select("title"))
			.text((d) => `IARU Band: ${d.band}`);

		bands.exit().remove();

		drawLabels(
			group,
			"iaru-band-label",
			HEIGHT / 2 - 20,
			"black",
			(d) => (xScale(d.start) + xScale(d.end)) / 2,
			(d) => `${d.band}\nband`,
		);

		if (k >= 50) {
			drawMarkers(
				group,
				"iaru-band-marker-start",
				HEIGHT - 3,
				HEIGHT + 20,
				"darkblue",
				(d) => xScale(d.start),
			);

			drawMarkers(
				group,
				"iaru-band-marker-end",
				HEIGHT - 3,
				HEIGHT + 20,
				"darkblue",
				(d) => xScale(d.end),
			);

			drawLabels(
				group,
				"iaru-band-marker-label-start",
				HEIGHT + 35,
				"darkblue",
				(d) => xScale(d.start),
				(d) => `${(d.start / 1e6).toFixed(3)} MHz`,
				true,
			);

			drawLabels(
				group,
				"iaru-band-marker-label-end",
				HEIGHT + 35,
				"darkblue",
				(d) => xScale(d.end),
				(d) => `${(d.end / 1e6).toFixed(3)} MHz`,
				true,
			);
		} else {
			group.selectAll(".iaru-band-marker-start").remove();
			group.selectAll(".iaru-band-marker-end").remove();
			group.selectAll(".iaru-band-marker-label-start").remove();
			group.selectAll(".iaru-band-marker-label-end").remove();
		}
	};

	return { onUpdate };
};
