import {
	C,
	debounce,
	getEventBus,
	getVelocityFactorFromURL,
	updateURLWithVelocityFactor,
} from "../utils.js";

const VoP = /** @type {HTMLInputElement} */ (
	document.getElementById("velocity-factor")
);
const SoL = /** @type {HTMLInputElement} */ (
	document.getElementById("speed-of-light")
);

let vf = getVelocityFactorFromURL();
/**
 * @param {number} newVf
 * @returns {string}
 */
const getSpeedOfLight = (newVf) => `${(C * newVf) / 100}`;

const debouncedUpdateURLWithVelocityFactor = debounce(
	(vf) => updateURLWithVelocityFactor(vf),
	1_000,
);

function onChange(vf) {
	debouncedUpdateURLWithVelocityFactor(vf);
	getEventBus().emit("velocityFactor", {
		velocityFactor: vf,
		speedOfLight: Number.parseInt(getSpeedOfLight(vf)),
	});
}

VoP.value = `${vf}`;
SoL.value = getSpeedOfLight(vf);
SoL.setAttribute("max", `${C}`);
if (vf !== 100) {
	onChange(vf);
}

/**
 * @param {Event & { target: HTMLInputElement }} event
 */
function handleVelocityFactorChange(event) {
	event.preventDefault();
	const newVf = Number(event.target.value);
	if (vf !== newVf) {
		vf = newVf;
		SoL.value = getSpeedOfLight(newVf);
		onChange(newVf);
	}
}

/**
 * @param {Event & { target: HTMLInputElement }} event
 */
function handleSpeedOfLightChange(event) {
	event.preventDefault();
	const newSoL = Number(event.target.value);
	const newVf = Math.ceil((newSoL / C) * 100_00) / 100;
	if (vf !== newVf) {
		vf = newVf;
		VoP.value = `${newVf}`;
		onChange(newVf);
	}
}

SoL.addEventListener("input", handleSpeedOfLightChange);
VoP.addEventListener("input", handleVelocityFactorChange);
