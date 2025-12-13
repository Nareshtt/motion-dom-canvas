import { parseTailwindValue } from "./packages/core/src/utils.js";

// Mock NAMED_VALUES since we can't import the internal object easily without full module
// But we can test the arbitrary value logic which is what matters.

console.log("Testing parseTailwindValue...");

const testCases = [
	"w-[50px]",
	"w-[1px]",
	"w-4",
	"border-[2px]",
	"border-[0.5px]",
];

// We need to mock the environment for the utils to run if they depend on DOM (they don't for parsing)
// But utils.js exports TAILWIND_MAP which is fine.

// Wait, utils.js uses ES modules. I need to run this with node.
// I'll just copy the relevant function to test it in isolation to avoid import issues.

function parseTailwindValueIsolated(className) {
	const NAMED_VALUES = {
		"rounded-full": 9999,
		"rounded-2xl": 16,
		"rounded-xl": 12,
		"rounded-lg": 8,
		"rounded-md": 6,
		rounded: 4,
		"tracking-widest": 0.1,
		"tracking-wider": 0.05,
		"tracking-wide": 0.025,
		"opacity-0": 0,
		"opacity-100": 100,
	};

	if (NAMED_VALUES.hasOwnProperty(className)) return NAMED_VALUES[className];

	const isNegative = className.startsWith("-");
	const clean = isNegative ? className.substring(1) : className;

	// Check for arbitrary values: w-[100px], m-[2rem], opacity-[0.5], translate-y-[-20px]
	const arbitraryMatch = clean.match(/^[a-z-]+-\[(.+)\]$/);
	if (arbitraryMatch) {
		const value = arbitraryMatch[1];

		// Check if the value itself is negative (e.g., [-20px])
		const valueIsNegative = value.startsWith("-");
		const cleanValue = valueIsNegative ? value.substring(1) : value;

		// Parse the value and unit
		const numMatch = cleanValue.match(/^([\d.]+)(.*)$/);
		if (numMatch) {
			let num = parseFloat(numMatch[1]);
			const unit = numMatch[2].trim();

			// Apply negativity from either the class prefix or the value itself
			if (isNegative || valueIsNegative) {
				num = -num;
			}

			// Return the raw number - the caller will handle unit conversion
			// For px values, divide by 4 to match Tailwind's scale (since we multiply by 4 later)
			if (unit === "px") {
				return num / 4;
			}
			// For rem values, multiply by 4 (since we multiply by 0.25 later)
			if (unit === "rem") {
				return num * 4;
			}
			// For unitless or percentage values
			if (unit === "" || unit === "%") {
				return num;
			}
			// For other units (em, vh, vw, etc.), return as-is
			return num;
		}

		// If no number found, return 0
		return 0;
	}

	// Standard Tailwind class: w-4, m-8, etc.
	const match = clean.match(/-(\d+)$/);

	if (match) {
		const val = parseInt(match[1], 10);
		return isNegative ? -val : val;
	}
	return 0;
}

testCases.forEach((c) => {
	const res = parseTailwindValueIsolated(c);
	console.log(`${c} -> ${res} (Adjusted px: ${res * 4})`);
});
