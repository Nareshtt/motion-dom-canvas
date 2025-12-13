// --- DICTIONARIES ---

export const TAILWIND_MAP = {
	// Sizing
	"w-": { prop: "width", unit: "px" },
	"h-": { prop: "height", unit: "px" },
	"min-w-": { prop: "minWidth", unit: "px" },
	"min-h-": { prop: "minHeight", unit: "px" },
	"max-w-": { prop: "maxWidth", unit: "px" },
	"max-h-": { prop: "maxHeight", unit: "px" },

	// Spacing
	"m-": { prop: "margin", unit: "px" },
	"mt-": { prop: "marginTop", unit: "px" },
	"mb-": { prop: "marginBottom", unit: "px" },
	"ml-": { prop: "marginLeft", unit: "px" },
	"mr-": { prop: "marginRight", unit: "px" },
	"p-": { prop: "padding", unit: "px" },
	"pt-": { prop: "paddingTop", unit: "px" },
	"pb-": { prop: "paddingBottom", unit: "px" },
	"pl-": { prop: "paddingLeft", unit: "px" },
	"pr-": { prop: "paddingRight", unit: "px" },

	// Typography
	"text-": { prop: "color", unit: "color" },
	"tracking-": { prop: "letterSpacing", unit: "em" },
	"leading-": { prop: "lineHeight", unit: "rem" },
	"font-": { prop: "fontWeight", unit: "number" },

	// Borders & Radius
	"border-": { prop: "borderWidth", unit: "px" },
	"rounded-": { prop: "borderRadius", unit: "px" },

	// Colors & Gradients
	"bg-": { prop: "backgroundColor", unit: "color" },
	"from-": { prop: "--tw-gradient-from", unit: "color" },
	"via-": { prop: "--tw-gradient-via", unit: "color" },
	"to-": { prop: "--tw-gradient-to", unit: "color" },

	// Transforms
	"rotate-": { prop: "rotate", unit: "deg" },
	"scale-": { prop: "scale", unit: "percent" },
	"translate-x-": { prop: "translate", unit: "px" },
	"translate-y-": { prop: "translate", unit: "px" },

	// Effects
	"opacity-": { prop: "opacity", unit: "percent" },
	"blur-": { prop: "filter", unit: "px" },
	"brightness-": { prop: "filter", unit: "percent" },
};

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

// --- COLOR RESOLVER ---

export function getRgbaFromColor(colorString) {
	if (!colorString || colorString === "transparent") return [0, 0, 0, 0];

	// Parse rgb(), rgba(), hsl(), etc.
	const rgbMatch = colorString.match(/rgba?\(([^)]+)\)/);
	if (rgbMatch) {
		const parts = rgbMatch[1]
			.split(/[\s,]+/)
			.map((p) => p.trim())
			.filter((p) => p);
		if (parts.length >= 3) {
			return [
				parseInt(parts[0]),
				parseInt(parts[1]),
				parseInt(parts[2]),
				parts[3] ? parseFloat(parts[3]) : 1,
			];
		}
	}

	// Fallback: Use browser to compute
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = colorString;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return [r, g, b, a / 255];
}

export function resolveTailwindColor(className, propName) {
	const div = document.createElement("div");
	div.className = className;
	div.style.visibility = "hidden";
	div.style.position = "fixed";
	div.style.top = "-9999px";
	document.body.appendChild(div);

	let colorString;

	if (propName.startsWith("--")) {
		// For gradient variables, ensure gradient is applied
		if (!div.className.includes("bg-gradient-")) {
			div.classList.add("bg-gradient-to-r");
		}
		div.offsetHeight; // Force reflow
		colorString = window.getComputedStyle(div).getPropertyValue(propName);

		// If we got a variable value, resolve it
		if (colorString) {
			div.style.color = colorString;
			colorString = window.getComputedStyle(div).color;
		}
	} else {
		colorString = window.getComputedStyle(div)[propName];
	}

	document.body.removeChild(div);

	const result = getRgbaFromColor(colorString);
	console.log(
		`🔬 resolveTailwindColor(${className}, ${propName}) = "${colorString}" = [${result}]`
	);
	return result;
}

// --- PARSERS ---

export function getPropertyFromClass(className) {
	const lookup = className.startsWith("-") ? className.substring(1) : className;

	if (lookup === "rounded") return { prop: "borderRadius", unit: "px" };
	if (lookup === "blur") return { prop: "filter", unit: "px" };

	for (const prefix in TAILWIND_MAP) {
		if (lookup.startsWith(prefix)) {
			if (prefix === "text-") {
				if (
					[
						"xs",
						"sm",
						"base",
						"lg",
						"xl",
						"2xl",
						"3xl",
						"4xl",
						"5xl",
						"6xl",
					].some((s) => lookup === `text-${s}`)
				) {
					return { prop: "fontSize", unit: "rem" };
				}
				return { prop: "color", unit: "color" };
			}
			return TAILWIND_MAP[prefix];
		}
	}
	return null;
}

export function parseTailwindValue(className) {
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

export const CSS_DEFAULTS = {
	opacity: 1,
	scale: 1,
	rotate: 0,
	translate: 0,
	filter: 0,
	backgroundColor: [0, 0, 0, 0],
	color: [0, 0, 0, 1],
};
