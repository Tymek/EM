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
	amateur: "#D0422D",
	civilian: "#205d4c",
	broadcast: "#C3A4E8",
	shipping: "#4682B4",
	aircraft: "#87b8ef",
	military: "#556B2F",
	police: "#412c00",
	emergency: "#F6E8C3",
	space: "#CBD9E9",
	unknown: "#606060",
};

/** @type import("../bandplanParser.js").BandplanSection[] */
let data = [];
let markers = [];
let visibleData = [];

async function loadData() {
	const data = (
		await Promise.all([
			fetch("data/IARU-1.rbp").then((response) => response.text()),
			// fetch("data/CEPT.rbp").then((response) => response.text()),
			fetch("data/space.rbp").then((response) => response.text()),
			fetch("data/PL.rbp").then((response) => response.text()),
		])
	).map(parseBandplan);
	return data;
}

/**
 * @type {import("../utils").PluginType}
 */
export const bandplanPlugin = (options) => {
	const { group: selection } = options;

	const group = selection.append("g").attr("class", "bands");

	/**
	 * Draws markers on the chart.
	 * @param {d3.Selection} selection
	 * @param {string} className
	 * @param {number} y1
	 * @param {number} y2
	 * @param {string} color
	 * @param {(d: import("../bandplanParser.js").BandplanSection) => number} xFunc
	 */
	const drawBandMarkers = (selection, className, y1, y2, color, xFunc) => {
		/** @type {d3.Selection<SVGLineElement, import("../bandplanParser.js").BandplanSection, SVGGElement, unknown>} */
		const markers = /** @type {any} */ (
			selection.selectAll(`.${className}`).data(
				visibleData.filter((x) => x?.band?.value),
				(d) => d,
			)
		);

		const markersEnter = markers
			.enter()
			.append("line")
			.attr("class", className)
			.attr("y1", y1)
			.attr("y2", y2)
			.attr("stroke", "#777")
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
				visibleData.filter((x) => x?.band?.value),
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
	 * @param {import("d3").ScaleLogarithmic<number, number, never>} xScale
	 * @param {number} k
	 */
	const onUpdate = (xScale, k) => {
		if (!xScale) return;
		lastScale = xScale;
		lastK = k;
		const visible = k >= 3;
		group.style("display", visible ? "block" : "none");

		if (!visible || data.length < 1) return;

		const [domainStart, domainEnd] = xScale.domain();
		visibleData = data.filter(
			(d) =>
				d?.band?.value &&
				d.band.value[1] > domainStart &&
				d.band.value[0] < domainEnd,
		);

		/** @type {d3.Selection<SVGRectElement, import("../bandplanParser.js").BandplanSection, SVGGElement, unknown>} */
		const bands = /** @type {any} */ (
			group.selectAll(".band").data(
				visibleData.filter((x) => x?.band?.value),
				(d) => d,
			)
		);

		const { height } = getDimensions();

		const bandsEnter = bands
			.enter()
			.append("rect")
			.attr("class", "band")
			.attr("y", 0)
			.attr("height", height);

		bandsEnter
			.merge(bands)
			.attr("x", (d) => xScale(d.band.value[0]))
			.attr("width", (d) => xScale(d.band.value[1]) - xScale(d.band.value[0]))
			.attr("fill", (d) => {
				if (d?.type?.value) {
					return colors[d.type.value.toLowerCase()] || colors.unknown;
				}
				return colors.unknown;
			});

		// bandsEnter
		// 	.append("title")
		// 	.merge(bands.select("title"))
		// 	.text((d) => `IARU Band: ${d.band}`);

		bands.exit().remove();

		if (k >= 50) {
			drawLabels(
				group,
				"band-label",
				height / 2 - 20,
				"black",
				(d) => (xScale(d.band.value[1]) + xScale(d.band.value[0])) / 2,
				(d) => (d.type.value === "amateur" ? `${d.title.value}` : d.type.value),
				true,
			);
		} else {
			group.selectAll(".band-label").remove();
		}

		// if (k >= 100) {
		// 	drawBandMarkers(
		// 		group,
		// 		"band-marker-start",
		// 		height,
		// 		height + 24,
		// 		"white",
		// 		(d) => xScale(d.band.value[0]),
		// 	);

		// 	drawBandMarkers(
		// 		group,
		// 		"band-marker-end",
		// 		height,
		// 		height + 24,
		// 		"white",
		// 		(d) => xScale(d.band.value[1]),
		// 	);

		// 	drawLabels(
		// 		group,
		// 		"band-marker-label-start",
		// 		height + 35,
		// 		"white",
		// 		(d) => xScale(d.band.value[0]),
		// 		(d) => `${encodeFrequency(d.band.value[0])} MHz`,
		// 		true,
		// 	);

		// 	drawLabels(
		// 		group,
		// 		"band-marker-label-end",
		// 		height + 35,
		// 		"white",
		// 		(d) => xScale(d.band.value[1]),
		// 		(d) => `${encodeFrequency(d.band.value[1])}Hz`,
		// 		true,
		// 	);
		// } else {
		// 	group.selectAll(".band-marker-start").remove();
		// 	group.selectAll(".band-marker-end").remove();
		// 	group.selectAll(".band-marker-label-start").remove();
		// 	group.selectAll(".band-marker-label-end").remove();
		// }

		if (k >= 500) {
			const visibleMarkers = markers.filter((d) => {
				const freq = d.frequency;
				return freq > domainStart && freq < domainEnd;
			});

			const markerItems = group
				.selectAll(".band-marker-item")
				.data(visibleMarkers);

			const markerItemsEnter = markerItems
				.enter()
				.append("g")
				.attr("class", "band-marker-item");

			markerItemsEnter.append("line");

			markerItemsEnter.append("text");

			const markerItemsUpdate = markerItemsEnter.merge(markerItems);

			markerItemsUpdate.attr(
				"transform",
				(d) => `translate(${xScale(d.frequency)}, ${height})`,
			);

			markerItemsUpdate
				.select("line")
				.attr("y1", 0)
				.attr("y2", 20)
				.attr("stroke", "gray")
				.attr("stroke-width", 1);

			markerItemsUpdate
				.select("text")
				.attr("text-anchor", "start")
				.attr("alignment-baseline", "middle")
				.attr("fill", "gray")
				.attr("font-size", "0.75em")
				.attr("transform", "translate(-2, 22), rotate(90)")
				.attr("display", (d) => (k >= 2_500 ? "block" : "none"))
				.text((d) => `${d.formattedFrequency} — ${d.description}`);

			markerItems.exit().remove();
		} else {
			group.selectAll(".band-marker-item").remove();
		}
	};

	loadData().then((v) => {
		data = v.flat();
		markers = data.flatMap((d) => {
			if (d?.markers?.data && d.markers.data.length > 0) {
				return d.markers.data;
			}
			return [];
		});

		onUpdate(lastScale, lastK);
	});

	return { onUpdate };
};
