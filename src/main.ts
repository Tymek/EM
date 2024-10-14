import "./style.css";
import * as d3 from "d3";
import { frequencyAxisPlugin } from "./plugins/frequencyAxis";
import { emSpectrumBandsPlugin } from "./plugins/emSpectrumBands";
import { wavelengthAxisPlugin } from "./plugins/wavelengthAxis";
import { visibleLightPlugin } from "./plugins/visibleLight";
import { pmrChannelsPlugin } from "./plugins/pmr";
import { bandplanPlugin } from "./plugins/bandplan";
import {
	MARGIN,
	WIDTH,
	HEIGHT,
	LEGEND_HEIGHT,
	debounce,
	getFrequenciesFromURL,
	updateURLWithFrequencies,
	type PluginType,
} from "./utils";

const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> = d3
	.select<SVGSVGElement, unknown>("#canvas")
	.attr("width", WIDTH + MARGIN.left + MARGIN.right)
	.attr("height", HEIGHT + MARGIN.top + MARGIN.bottom + LEGEND_HEIGHT);

const defs = svg.append("defs");

const DOMAIN = [3, 3e24]; // Full frequency range

const xScaleFull = d3
	.scaleLog()
	.domain(DOMAIN)
	.range([MARGIN.left, WIDTH - MARGIN.right]);

const initialFrequencies = getFrequenciesFromURL() || DOMAIN;

const xScale = d3
	.scaleLog()
	.domain(initialFrequencies)
	.range([MARGIN.left, WIDTH - MARGIN.right]);

const svgGroup = svg
	.append("g")
	.attr("transform", `translate(0, ${MARGIN.top})`) as d3.Selection<
	SVGGElement,
	unknown,
	HTMLElement,
	unknown
>;

const plugins = [
	emSpectrumBandsPlugin,
	frequencyAxisPlugin,
	visibleLightPlugin,
	wavelengthAxisPlugin,
	pmrChannelsPlugin,
	bandplanPlugin,
].map((plugin) => plugin({ group: svgGroup, defs }));

const updatePlugins: ReturnType<PluginType>["onUpdate"] = (scale, k) => {
	for (const plugin of plugins) {
		plugin.onUpdate(scale, k);
	}
};

// Compute initial transform based on initial frequencies
const [startFreq, endFreq] = xScale.domain();
const xStart = xScaleFull(startFreq);
const xEnd = xScaleFull(endFreq);
const deltaX = xEnd - xStart;
const deltaRange = WIDTH - MARGIN.left - MARGIN.right;
const k = deltaRange / deltaX;
const tx = MARGIN.left - k * xStart;

const initialTransform = d3.zoomIdentity.translate(tx, 0).scale(k);

const zoom = d3
	.zoom<SVGSVGElement, unknown>()
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

// Apply initial transform
svg.call(zoom).call(zoom.transform, initialTransform);

function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
	requestAnimationFrame(() => {
		const t = event.transform;
		const newXScale = t.rescaleX(xScaleFull);
		xScale.domain(newXScale.domain());

		updatePlugins(xScale, t.k);

		debouncedUpdateURLWithFrequencies(xScale.domain());
	});
}

updatePlugins(xScale, 1);

const debouncedUpdateURLWithFrequencies = debounce(
	updateURLWithFrequencies,
	500,
);