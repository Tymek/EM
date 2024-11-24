import { attributeParsers } from "./bandplanParser.js";

{
	const { markers } = attributeParsers;
	const marker = {
		value: "CSV MHz, description",
		note: "note",
		data: ["144.050, CW calling", "144.100, Random MS"],
	};

	const result = markers(marker);

	if (!(result.data[0].frequency === 144050000)) {
		throw new Error("parse frequency");
	}
}
