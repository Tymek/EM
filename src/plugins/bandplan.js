import { parseBandplan } from "../bandplanParser.js";
import { encodeFrequency, getDimensions } from "../utils.js";

/**
 * @typedef {Object} TypeValue
 * @property {string} value - The value of the type.
 */

/**
 * @typedef {Object} BandRange
 * @property {[number, number]} value - Array containing the start and end frequency in Hz.
 */

/**
 * @typedef {(value: number) => number} XScale
 */

const colors = {
	amateur: "#409171",
	civil: "#469fb1",
	space: "#d8e8de",
};

/** @type import("../bandplanParser.js").BandplanSection[] */
let data = [];

async function loadData() {
	const data = (
		await Promise.all([
			fetch("data/IARU-1.rbp").then((response) => response.text()),
			// fetch("data/CEPT.rbp").then((response) => response.text()),
			// fetch("data/space.rbp").then((response) => response.text()),
		])
	).map(parseBandplan);
	return data;
}

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
	 * @param {(d: import("../bandplanParser.js").BandplanSection) => number} xFunc
	 */
	const drawMarkers = (selection, className, y1, y2, color, xFunc) => {
		/** @type {d3.Selection<SVGLineElement, import("../bandplanParser.js").BandplanSection, SVGGElement, unknown>} */
		const markers = /** @type {any} */ (
			selection.selectAll(`.${className}`).data(
				data.filter((x) => x?.band?.value),
				(d) => d,
			)
		);

		const markersEnter = markers
			.enter()
			.append("line")
			.attr("class", className)
			.attr("y1", y1)
			.attr("y2", y2)
			.attr("stroke", "#555")
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
	 * @param {(d: import("../bandplanParser.js").BandplanSection) => number} xFunc
	 * @param {(d: import("../bandplanParser.js").BandplanSection) => string} textFunc
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
		/** @type {d3.Selection<SVGTextElement, import("../bandplanParser.js").BandplanSection, SVGGElement, unknown>} */
		const labels = /** @type {any} */ (
			selection.selectAll(`.${className}`).data(
				data.filter((x) => x?.band?.value),
				(d) => d,
			)
		);

		const labelsEnter = labels
			.enter()
			.append("text")
			.attr("class", className)
			.attr("y", y)
			.attr("text-anchor", rotate ? "start" : "middle")
			.attr("alignment-baseline", "middle")
			.attr("fill", fill);

		labelsEnter
			.merge(labels)
			.attr("x", xFunc)
			.text(textFunc)
			.attr("font-size", "0.75em");

		if (rotate) {
			labelsEnter.merge(labels).attr("transform", (d) => {
				const x = xFunc(d);
				return `rotate(90, ${x + 2}, ${y - 2})`;
			});
		}

		labels.exit().remove();
	};

	let lastScale = null;
	let lastK = 1;

	/**
	 * Updates the chart with new scaling and zoom level.
	 * @param {XScale} xScale
	 * @param {number} k
	 */
	const onUpdate = (xScale, k) => {
		lastScale = xScale;
		lastK = k;
		const visible = k >= 3;
		group.style("display", visible ? "block" : "none");

		if (!visible || data.length < 1) return;

		/** @type {d3.Selection<SVGRectElement, import("../bandplanParser.js").BandplanSection, SVGGElement, unknown>} */
		const bands = /** @type {any} */ (
			group.selectAll(".iaru-band").data(
				data.filter((x) => x?.band?.value),
				(d) => d,
			)
		);

		const { height } = getDimensions();

		const bandsEnter = bands
			.enter()
			.append("rect")
			.attr("class", "iaru-band")
			.attr("y", 0)
			.attr("height", height)
			.attr("fill", "#409171");

		bandsEnter
			.merge(bands)
			.attr("x", (d) => xScale(d.band.value[0]))
			.attr("width", (d) => xScale(d.band.value[1]) - xScale(d.band.value[0]));

		bandsEnter
			.append("title")
			.merge(bands.select("title"))
			.text((d) => `IARU Band: ${d.band}`);

		bands.exit().remove();

		if (k >= 50) {
			drawLabels(
				group,
				"iaru-band-label",
				height / 2 - 20,
				"black",
				(d) => (xScale(d.band.value[1]) + xScale(d.band.value[0])) / 2,
				(d) => `${d.title.value}\nband`,
			);
		} else {
			group.selectAll(".iaru-band-label").remove();
		}

		if (k >= 100) {
			drawMarkers(
				group,
				"iaru-band-marker-start",
				height,
				height + 20,
				"white",
				(d) => xScale(d.band.value[0]),
			);

			drawMarkers(
				group,
				"iaru-band-marker-end",
				height,
				height + 20,
				"white",
				(d) => xScale(d.band.value[1]),
			);

			drawLabels(
				group,
				"iaru-band-marker-label-start",
				height + 35,
				"white",
				(d) => xScale(d.band.value[0]),
				(d) => `${encodeFrequency(d.band.value[0])} MHz`,
				true,
			);

			drawLabels(
				group,
				"iaru-band-marker-label-end",
				height + 35,
				"white",
				(d) => xScale(d.band.value[1]),
				(d) => `${encodeFrequency(d.band.value[1])}Hz`,
				true,
			);
		} else {
			group.selectAll(".iaru-band-marker-start").remove();
			group.selectAll(".iaru-band-marker-end").remove();
			group.selectAll(".iaru-band-marker-label-start").remove();
			group.selectAll(".iaru-band-marker-label-end").remove();
		}
	};

	loadData().then((v) => {
		data = v.flat();
		onUpdate(lastScale, lastK);
	});

	return { onUpdate };
};
