// Import styles and libraries
// import "./style.css";
import { frequencyAxisPlugin } from "./plugins/frequencyAxis.js";
import { emSpectrumBandsPlugin } from "./plugins/emSpectrumBands.js";
import { wavelengthAxisPlugin } from "./plugins/wavelengthAxis.js";
import { visibleLightPlugin } from "./plugins/visibleLight.js";
import { pmrChannelsPlugin } from "./plugins/pmr.js";
import { bandplanPlugin } from "./plugins/bandplan.js";
import {
	MARGIN,
	WIDTH,
	HEIGHT,
	LEGEND_HEIGHT,
	debounce,
	getFrequenciesFromURL,
	updateURLWithFrequencies,
	loadComponent,
} from "./utils.js";

const { d3 } = window;

/**
 * Selects the SVG element with the ID 'canvas' and sets its attributes.
 *
 * @type {d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>} svg - D3 selection of the SVG element.
 */
const svg = d3.select("#canvas");

svg.attr("min-height", HEIGHT + MARGIN.top + MARGIN.bottom + LEGEND_HEIGHT);

const defs = svg.append("defs");

/**
 * Define the frequency domain (from planet to quantum scale).
 * @type {[number, number]}
 */
const DOMAIN = [3, 3e24]; // Full frequency range

// Define the full x-scale using a logarithmic scale
const xScaleFull = d3
	.scaleLog()
	.domain(DOMAIN)
	.range([MARGIN.left, WIDTH - MARGIN.right]);

// Get initial frequencies from URL or default to DOMAIN
const initialFrequencies = getFrequenciesFromURL() || DOMAIN;

// Define the x-scale for the initial view
const xScale = d3
	.scaleLog()
	.domain(initialFrequencies)
	.range([MARGIN.left, WIDTH - MARGIN.right]);

// Create a group for adding graphical elements
const svgGroup = svg
	.append("g")
	.attr("transform", `translate(0, ${MARGIN.top})`);

// Initialize plugins and apply them to the group
const plugins = [
	emSpectrumBandsPlugin,
	frequencyAxisPlugin,
	visibleLightPlugin,
	wavelengthAxisPlugin,
	pmrChannelsPlugin,
	bandplanPlugin,
].map((plugin) => plugin({ group: svgGroup, defs }));

// Define the function to update plugins
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
const deltaRange = WIDTH - MARGIN.left - MARGIN.right;
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
function zoomed(event) {
	// requestAnimationFrame(() => {
	const t = event.transform;
	const newXScale = t.rescaleX(xScaleFull);
	xScale.domain(newXScale.domain());

	updatePlugins(xScale, t.k);

	debouncedUpdateURLWithFrequencies(xScale.domain());
	// });
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
		[WIDTH - MARGIN.right, HEIGHT],
	])
	.on("zoom", zoomed);

// Apply initial transform and set up zoom
svg.call(zoom).call(zoom.transform, initialTransform);

loadComponent("/src/components/fullscreen.html").then((data) => {
	document.querySelector("#controls")?.appendChild(data);
});
