import { decodeFrequency } from "./utils.js";

/**
 * Removes top-level notes and inline comments from a line of text.
 * @param {string} line
 * @returns {string}
 */
function removeComments(line) {
	if (line.startsWith("#/")) {
		return ""; // Remove top-level notes
	}
	const commentIndex = line.indexOf("#//");
	return commentIndex >= 0 ? line.slice(0, commentIndex).trimEnd() : line;
}

/**
 * @param {string} line
 * @returns {[string, string | undefined]}
 */
function splitNote(line) {
	if (!line) {
		return ["", undefined];
	}
	const noteIndex = line.indexOf("#/");
	if (noteIndex === -1) {
		return [line, undefined];
	}
	return [line.slice(0, noteIndex).trim(), line.slice(noteIndex + 2).trim()];
}

/**
 * Splits provided lines into sections based on indentation
 * @param {[string, string[]][]} acc
 * @param {string} line
 * @returns {Array<[string, string[]]>} - [header, lines[]][]
 */
function foldIndentation(acc, line) {
	const [header, section] = acc.at(-1) || [];
	if (line.startsWith("  ") || line.startsWith("\t")) {
		if (header !== undefined) {
			const trimmedLine = line[0] === " " ? line.slice(2) : line.slice(1);
			acc[acc.length - 1] = [header, [...section, trimmedLine]];
		}
	} else {
		acc.push([line, []]);
	}

	return acc;
}

/**
 * Remove notes from headers, re-add as attributes
 * @param {[string, string[]]} section
 * @returns {[string, string[]]}
 */
function moveNoteDown([header, lines]) {
	const [title, note] = splitNote(header);
	if (note) {
		lines.unshift(`note ${note}`);
	}

	return [title, lines];
}

/**
 * Splits a string on the first occurrence of a separator.
 * @param {string} str
 * @param {string} sep
 * @returns {[string, string]}
 */
function splitOnFirst(str, sep) {
	const index = str.indexOf(sep);
	return index < 0
		? [str, ""]
		: [str.slice(0, index), str.slice(index + sep.length)];
}

/**
 * @typedef {Object} BandplanAttribute
 * @property {string | any} [value]
 * @property {string} [note]
 * @property {string[]} [data]
 */
/**
 * @typedef {Object.<string, BandplanAttribute>} Bandplan
 */

const attributeParsers = {
	/**
	 * @param {BandplanAttribute} attribute
	 * @returns {{value: [number, number], note?: string}}
	 */
	band: (attribute) => {
		const [start, end] = attribute.value
			.split("-")
			.map((v) => decodeFrequency(v.trim().replace("Hz", "")));
		return { ...attribute, value: [start, end] };
	},
};

/**
 * @param {[string, string[]]} section
 * @returns {[string, BandplanAttribute]}
 */
function parseAttribute([header, lines]) {
	let [title, note] = splitNote(header);
	if (note && !title) {
		title = `note ${note}`;
		note = undefined;
	}
	const [key, value] = splitOnFirst(title, " ");
	/**@type {BandplanAttribute} */
	const output = {};
	if (value) output.value = value;
	if (note) output.note = note;
	if (lines.length > 0) output.data = lines;

	if (Object.keys(attributeParsers).includes(key)) {
		const parser = attributeParsers[key];
		return [key, parser(output)];
	}
	return [key, output];
}

/**
 * Parses the input text to extract band information.
 * Let's avoid regex like the plague it is. @see https://regexlicensing.org/
 * @param {string} input
 * @returns {Bandplan} An object with band names as keys and frequency ranges as values.
 */
export function parseBandplan(input) {
	const lines = input
		.split("\n")
		.map(removeComments)
		.filter((line) => line.trim().length > 0); // discard empty lines

	const globalAttributes = /** @type {string[]} */ ([]);
	for (const line of lines) {
		if (!line.startsWith("  ") && !line.startsWith("\t")) {
			break;
		}
		globalAttributes.push(line.trim());
	}

	const sections = lines
		.reduce(foldIndentation, [])
		.map(moveNoteDown)
		.map(([header, lines]) => {
			const attributes = [...globalAttributes, ...lines]
				.reduce(foldIndentation, [])
				.map(parseAttribute);
			return [header, Object.fromEntries(attributes)];
		});

	return Object.fromEntries(sections);
}
