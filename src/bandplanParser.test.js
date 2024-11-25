import { attributeParsers } from "./bandplanParser.js";

{
	const { markers } = attributeParsers;
	const marker = {
		value: "CSV MHz, description",
		note: "note",
		data: [
			"144.050, CW calling",
			"144.100, Random MS",
			"144.600, DATA centre of activity (MGM, RTTY)",
		],
	};

	const result = markers(marker);
	// console.debug(result.data);

	// @ts-ignore
	if (!(result.data[0].frequency === 144050000)) {
		throw new Error("parse frequency");
	}

	// @ts-ignore
	if (!(result.data[0].description === "CW calling")) {
		throw new Error("parse description");
	}

	// @ts-ignore
	if (!(result.data[2].description === "DATA centre of activity (MGM, RTTY)")) {
		console.log(result.data[2]);
		throw new Error("parse complex description");
	}
}
