import { frequencyAxisPlugin } from "./plugins/frequencyAxis.js";
import { emSpectrumBandsPlugin } from "./plugins/emSpectrumBands.js";
import { wavelengthAxisPlugin } from "./plugins/wavelengthAxis.js";
import { visibleLightPlugin } from "./plugins/visibleLight.js";
import { pmrChannelsPlugin } from "./plugins/pmr.js";
import { bandplanPlugin } from "./plugins/bandplan.js";
import {
	MARGIN,
	LEGEND_HEIGHT,
	debounce,
	getFrequenciesFromURL,
	updateURLWithFrequencies,
	loadComponent,
	DOMAIN,
	getDimensions,
	throttle,
} from "./utils.js";

const { d3 } = window;

/**
 * Selects the SVG element with the ID 'canvas' and sets its attributes.
 *
 * @type {d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>} svg - D3 selection of the SVG element.
 */
const SVG = d3.select("#canvas");

const initialize = () => {
	SVG.selectAll("*").remove();
	const { width, height } = getDimensions();
	SVG.attr("min-height", height + LEGEND_HEIGHT);

	const defs = SVG.append("defs");

	// Define the full x-scale using a logarithmic scale
	const xScaleFull = d3
		.scaleLog()
		.domain(DOMAIN)
		.range([MARGIN.left, width - MARGIN.right]);

	// Get initial frequencies from URL or default to DOMAIN
	const initialFrequencies = getFrequenciesFromURL() || DOMAIN;

	// Define the x-scale for the initial view
	const xScale = d3
		.scaleLog()
		.domain(initialFrequencies)
		.range([MARGIN.left, width - MARGIN.right]);

	// Create a group for adding graphical elements
	const svgGroup = SVG.append("g").attr(
		"transform",
		`translate(0, ${MARGIN.top})`,
	);

	// Initialize plugins and apply them to the group
	const plugins = [
		emSpectrumBandsPlugin,
		frequencyAxisPlugin,
		visibleLightPlugin,
		wavelengthAxisPlugin,
		pmrChannelsPlugin,
		bandplanPlugin,
	].map((plugin) => plugin({ group: svgGroup, defs }));

	// Define the function updating plugins for attaching update handlers
	const updatePlugins = (scale, k) => {
		for (const plugin of plugins) {
			plugin.onUpdate(scale, k);
		}
	};

	// Compute the initial transform based on initial frequencies
	const [startFreq, endFreq] = xScale.domain();
	const xStart = xScaleFull(startFreq);
	const xEnd = xScaleFull(endFreq);
	const deltaX = xEnd - xStart;
	const deltaRange = width - MARGIN.left - MARGIN.right;
	const k = deltaRange / deltaX;
	const tx = MARGIN.left - k * xStart;

	const initialTransform = d3.zoomIdentity.translate(tx, 0).scale(k);

	// Debounced function to update URL with new frequencies
	const debouncedUpdateURLWithFrequencies = debounce(
		(newScale) => updateURLWithFrequencies(newScale, DOMAIN),
		1_000,
	);

	/**
	 * Handles the zoom event.
	 * @param {d3.D3ZoomEvent<SVGSVGElement, unknown>} event - The zoom event object.
	 */
	function handleZoom(event) {
		requestAnimationFrame(() => {
			const t = event.transform;
			const newXScale = t.rescaleX(xScaleFull);
			xScale.domain(newXScale.domain());

			updatePlugins(xScale, t.k);

			debouncedUpdateURLWithFrequencies(xScale.domain());
		});
	}

	/** Define zoom behavior
	 * @type {d3.ZoomBehavior<SVGSVGElement, unknown>} */
	const zoom = d3.zoom();

	zoom
		.scaleExtent([1, 1_000_000])
		.translateExtent([
			[xScaleFull.range()[0], 0],
			[xScaleFull.range()[1], 0],
		])
		.extent([
			[MARGIN.left, 0],
			[width - MARGIN.right, height],
		])
		.on("zoom", handleZoom);

	// Apply initial transform and set up zoom
	SVG.call(zoom).call(zoom.transform, initialTransform);
};

initialize();

loadComponent("/src/components/velocity-factor.html").then((data) => {
	document.querySelector("#controls")?.appendChild(data);
	import("./components/velocity-factor.js");
});

loadComponent("/src/components/fullscreen.html").then((data) => {
	document.querySelector("#controls")?.appendChild(data);
});

const onResize = throttle(initialize, 250); // butter smooth 4fps
window.addEventListener("resize", onResize);

// async function loadData() {
// 	const { parseBandplan } = await import("./bandplanParser.js");
// 	const data = (
// 		await Promise.all([
// 			fetch("src/data/IARU-1.rbp").then((response) => response.text()),
// 			fetch("src/data/CEPT.rbp").then((response) => response.text()),
// 			fetch("src/data/space.rbp").then((response) => response.text()),
// 		])
// 	).map(parseBandplan);
// 	console.log(data);
// }
// loadData();
