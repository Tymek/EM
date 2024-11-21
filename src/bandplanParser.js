import { decodeFrequency } from "./utils.js";

/**
 * Removes top-level notes and inline comments from a line of text.
 * @param {string} line - The line of text to process.
 * @returns {string} The line without comments.
 */
function removeComments(line) {
	if (line.startsWith("#/")) {
		return ""; // Remove top-level notes
	}
	const commentIndex = line.indexOf("#//");
	return commentIndex >= 0 ? line.slice(0, commentIndex).trimEnd() : line;
}

/**
 * Splits a line of text into its main content and any note.
 * @param {string} line - The line of text to split.
 * @returns {[string, string | undefined]} The main content and the note (if any).
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
 * Splits provided lines into sections based on indentation.
 * @param {[string, string[]][]} acc - The accumulated sections.
 * @param {string} line - The current line to process.
 * @returns {Array<[string, string[]]>} The updated accumulated sections.
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
 * Moves notes from headers to section lines as attributes.
 * @param {[string, string[]]} section - The section to process.
 * @returns {[string, string[]]} The section with notes moved down.
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
 * @param {string} str - The string to split.
 * @param {string} sep - The separator to split on.
 * @returns {[string, string]} The two parts of the split string.
 */
function splitOnFirst(str, sep) {
	const index = str.indexOf(sep);
	return index < 0
		? [str, ""]
		: [str.slice(0, index), str.slice(index + sep.length)];
}

/**
 * @typedef {Object} BandplanAttribute
 * @property {string | any} [value] - The value of the attribute.
 * @property {string} [note] - The note associated with the attribute.
 * @property {string[]} [data] - Additional data for the attribute.
 */

/**
 * @typedef {Object.<string, BandplanAttribute>} BandplanSection
 */

const attributeParsers = {
	/**
	 * Parses a band attribute to extract frequency range.
	 * @param {BandplanAttribute} attribute - The attribute to parse.
	 * @returns {{value: [number, number], note?: string}} The parsed attribute with frequency range.
	 */
	band: (attribute) => {
		const [start, end] = attribute.value
			.split("-")
			.map((v) => decodeFrequency(v.trim().replace("Hz", "")));
		return { ...attribute, value: [start, end] };
	},
};

/**
 * Parses a section header and lines into a BandplanAttribute.
 * @param {[string, string[]]} section - The section to parse.
 * @returns {[string, BandplanAttribute]} The parsed attribute key and value.
 */
function parseAttribute([header, lines]) {
	let [title, note] = splitNote(header);
	if (note && !title) {
		title = `note ${note}`;
		note = undefined;
	}
	const [key, value] = splitOnFirst(title, " ");
	/** @type {BandplanAttribute} */
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
 * @param {string} input - The input text to parse.
 * @returns {BandplanSection[]} An array of objects with band names as keys and frequency ranges as values.
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
		.map(([title, lines]) => {
			const attributes = [...globalAttributes, ...lines]
				.reduce(foldIndentation, [])
				.map(parseAttribute);
			return {
				title: { value: title },
				...Object.fromEntries(attributes),
			};
		});

	return sections;
}
