import { useEffect, useRef } from "react";
import chroma from "chroma-js";
import {
	parseTailwindValue,
	getPropertyFromClass,
	resolveTailwindColor,
	getRgbaFromColor,
	TAILWIND_MAP,
	CSS_DEFAULTS,
} from "./utils.js";

// --- MATH & TIMING ---

function map(from, to, value) {
	return from + (to - from) * value;
}

export function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeInCubic(x) {
	return x * x * x;
}

export function easeOutCubic(x) {
	return 1 - Math.pow(1 - x, 3);
}

// Back
export function easeInBack(x) {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return c3 * x * x * x - c1 * x * x;
}

export function easeOutBack(x) {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function easeInOutBack(x) {
	const c1 = 1.70158;
	const c2 = c1 * 1.525;
	return x < 0.5
		? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
		: (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

// Bounce
export function easeOutBounce(x) {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

export function easeInBounce(x) {
	return 1 - easeOutBounce(1 - x);
}

export function easeInOutBounce(x) {
	return x < 0.5
		? (1 - easeOutBounce(1 - 2 * x)) / 2
		: (1 + easeOutBounce(2 * x - 1)) / 2;
}

// Elastic
export function easeOutElastic(x) {
	const c4 = (2 * Math.PI) / 3;
	return x === 0
		? 0
		: x === 1
		? 1
		: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function easeInElastic(x) {
	const c4 = (2 * Math.PI) / 3;
	return x === 0
		? 0
		: x === 1
		? 1
		: -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

export function easeInOutElastic(x) {
	const c5 = (2 * Math.PI) / 4.5;
	return x === 0
		? 0
		: x === 1
		? 1
		: x < 0.5
		? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
		: (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

export function lerp(a, b, t) {
	return a + (b - a) * t;
}

export function lerpColor(start, end, t) {
	const c1 = chroma(start[0], start[1], start[2], start[3]);
	const c2 = chroma(end[0], end[1], end[2], end[3]);
	return c1.mix(c2, t, "lch").css();
}

export function* waitFor(duration) {
	let time = 0;
	while (time < duration) {
		const dt = yield;
		time += dt || 0;
	}
}

let isCalculating = false;

export function calculateDuration(generatorFn) {
	isCalculating = true;

	// 1. Identify potential globals used in the generator
	const code = generatorFn.toString();
	const identifiers = new Set();
	// Regex to find function calls: name(
	const regex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
	let match;
	while ((match = regex.exec(code)) !== null) {
		identifiers.add(match[1]);
	}

	// 2. Mock missing globals
	const mocked = [];
	identifiers.forEach((id) => {
		if (typeof window[id] === "undefined") {
			// Mock it
			window[id] = (...args) => {
				// Assume last arg is duration if number, else 0
				const last = args[args.length - 1];
				const duration = typeof last === "number" ? last : 0;
				return tween(duration, () => {});
			};
			mocked.push(id);
		}
	});

	try {
		const iterator = generatorFn();
		let time = 0;
		const dt = 1 / 60; // Simulation step

		let result = iterator.next();
		while (!result.done) {
			time += dt;
			result = iterator.next(dt);
		}
		return time;
	} catch (e) {
		return 0;
	} finally {
		// 3. Cleanup
		mocked.forEach((id) => {
			delete window[id];
		});
		isCalculating = false;
	}
}

export function* tween(duration, onUpdate) {
	let time = 0;
	while (time < duration) {
		const dt = yield;
		time += dt || 0;
		if (!isCalculating) {
			const progress = Math.min(time / duration, 1);
			onUpdate(progress);
		}
	}
	if (!isCalculating) {
		onUpdate(1);
	}
}

// --- FLOW CONTROL ---

export function* all(...tasks) {
	while (tasks.length > 0) {
		const dt = yield;
		for (let i = 0; i < tasks.length; i++) {
			const task = tasks[i];
			const result = task.next(dt);
			if (result.done) {
				tasks.splice(i, 1);
				i--;
			}
		}
	}
}

export function* chain(...tasks) {
	for (const task of tasks) {
		yield* task;
	}
}

export function* delay(seconds, task) {
	yield* waitFor(seconds);
	yield* task;
}

export function* slide(duration = 1) {
	yield* waitFor(duration);
}

export function* fade(duration = 1) {
	yield* waitFor(duration);
}

export function* zoom(duration = 1) {
	yield* waitFor(duration);
}

// --- INTELLIGENT GETTERS ---

function extractColorFromGradientClass(className) {
	// Extract just the color part: "from-blue-500" -> "blue-500"
	const match = className.match(/^(?:from|to|via)-(.+)$/);
	return match ? match[1] : null;
}

function getColorFromInlineStyle(el, prop) {
	// Check if this gradient property was set inline
	if (prop.startsWith("--tw-gradient-")) {
		const val = el.style.getPropertyValue(prop);
		if (val) {
			const color = getRgbaFromColor(val);
			if (color[3] !== 0) {
				return color;
			}
		}
	}
	return null;
}

function getColorFromClass(el, prop) {
	// Map gradient properties to their class prefixes
	const prefixMap = {
		"--tw-gradient-from": "from-",
		"--tw-gradient-via": "via-",
		"--tw-gradient-to": "to-",
	};

	const prefix = prefixMap[prop];
	if (!prefix) return null;

	// Find the gradient class
	const gradientClass = Array.from(el.classList).find((c) =>
		c.startsWith(prefix)
	);
	if (!gradientClass) return null;

	// Extract color name and resolve it
	const colorName = extractColorFromGradientClass(gradientClass);
	if (colorName) {
		const bgClass = `bg-${colorName}`;
		return resolveTailwindColor(bgClass, "backgroundColor");
	}

	return null;
}

function getCurrentValue(el, prop, unit) {
	// 1. Check inline style (for interrupted animations)
	if (unit === "color") {
		const inlineColor = getColorFromInlineStyle(el, prop);
		if (inlineColor) return inlineColor;

		// 2. Check classes for gradient properties
		if (prop.startsWith("--tw-gradient-")) {
			const classColor = getColorFromClass(el, prop);
			if (classColor && classColor[3] !== 0) return classColor;

			// 3. Fallback to background color
			const computed = window.getComputedStyle(el);
			return getRgbaFromColor(computed.backgroundColor);
		}

		// Regular color property
		const computed = window.getComputedStyle(el);
		return getRgbaFromColor(computed[prop]);
	}

	// Non-color properties
	const inlineStyle = el.style[prop];
	if (inlineStyle) return parseFloat(inlineStyle);

	const computed = window.getComputedStyle(el);
	const val = computed[prop];
	if (val) return parseFloat(val);

	return CSS_DEFAULTS[prop] || 0;
}

function isGradient(el) {
	return (
		el.className.includes("bg-gradient-") ||
		window.getComputedStyle(el).backgroundImage.includes("gradient")
	);
}

// --- THE ANIMATOR ---

function* createAnimation(id, ...args) {
	const el = document.getElementById(id);
	if (!el) return;

	let fromString, toString, duration;
	if (args.length === 3) {
		[fromString, toString, duration] = args;
	} else if (args.length === 2) {
		[toString, duration] = args;
	} else {
		return;
	}

	const toClasses = toString.split(" ").filter((c) => c.trim() !== "");
	const fromClasses = fromString
		? fromString.split(" ").filter((c) => c.trim() !== "")
		: [];

	// Upgrade to gradient if needed
	const hasGradientProps = toClasses.some(
		(c) => c.startsWith("from-") || c.startsWith("to-") || c.startsWith("via-")
	);
	if (hasGradientProps && !isGradient(el)) {
		el.classList.add("bg-gradient-to-r");
	}

	const tasks = [];

	toClasses.forEach((toClass, index) => {
		const propDef = getPropertyFromClass(toClass);
		if (!propDef) return;
		const { prop, unit } = propDef;

		// Get START value
		let startVal;
		if (fromClasses.length > index) {
			const fromClass = fromClasses[index];

			if (unit === "color") {
				// For gradient classes, extract the color part
				if (
					fromClass.startsWith("from-") ||
					fromClass.startsWith("to-") ||
					fromClass.startsWith("via-")
				) {
					const colorName = extractColorFromGradientClass(fromClass);
					const bgClass = `bg-${colorName}`;
					startVal = resolveTailwindColor(bgClass, "backgroundColor");
				} else {
					startVal = resolveTailwindColor(fromClass, prop);
				}
			} else {
				startVal = parseTailwindValue(fromClass);
			}
		} else {
			startVal = getCurrentValue(el, prop, unit);
		}

		// Get END value
		let endVal;

		if (unit === "color") {
			// For gradient classes, extract the color part
			if (
				toClass.startsWith("from-") ||
				toClass.startsWith("to-") ||
				toClass.startsWith("via-")
			) {
				const colorName = extractColorFromGradientClass(toClass);
				const bgClass = `bg-${colorName}`;
				endVal = resolveTailwindColor(bgClass, "backgroundColor");
			} else {
				endVal = resolveTailwindColor(toClass, prop);
			}
		} else {
			endVal = parseTailwindValue(toClass);
		}

		// Adjust non-color values
		if (unit !== "color") {
			const adjust = (val) => {
				if (unit === "px") return val * 4;
				if (unit === "rem") return val * 0.25;
				if (unit === "percent") return val / 100;
				return val;
			};
			if (fromClasses.length > index) startVal = adjust(startVal);
			endVal = adjust(endVal);
		}

		tasks.push({ prop, unit, startVal, endVal, toClass });
	});

	// Run the tween
	yield* tween(duration, (t) => {
		const eased = easeInOutCubic(t);

		tasks.forEach((task) => {
			const { prop, unit, startVal, endVal } = task;

			if (unit === "color") {
				const colorStr = lerpColor(startVal, endVal, eased);
				if (prop.startsWith("--")) {
					el.style.setProperty(prop, colorStr);
				} else {
					el.style[prop] = colorStr;
				}
			} else {
				const current = lerp(startVal, endVal, eased);
				let valStr = current;
				if (unit === "px") valStr = `${current}px`;
				else if (unit === "rem") valStr = `${current}rem`;
				else if (unit === "deg") valStr = `${current}deg`;
				else if (unit === "percent" && prop === "opacity") valStr = current;

				if (prop === "translate") {
					const axis = task.toClass.includes("-x-") ? "X" : "Y";
					el.style.translate = axis === "X" ? `${valStr} 0` : `0 ${valStr}`;
				} else if (prop === "filter") {
					const fname = task.toClass.includes("brightness")
						? "brightness"
						: "blur";
					const suffix = fname === "blur" ? "px" : "%";
					el.style.filter = `${fname}(${current}${suffix})`;
				} else {
					el.style[prop] = valStr;
				}
			}
		});
	});
}

export function setupGlobals() {
	document.querySelectorAll("[id]").forEach((el) => {
		window[el.id] = (...args) => createAnimation(el.id, ...args);
	});
}

// --- THE CRITICAL useScene HOOK ---

export function useScene(
	animationCallback,
	onFinished,
	isPlaying = true,
	seekOffset = 0
) {
	const iteratorRef = useRef(null);
	const requestIdRef = useRef(null);

	useEffect(() => {
		// 1. Check for Render Mode
		const urlParams = new URLSearchParams(window.location.search);
		const isRenderMode = urlParams.get("render") === "true";

		setupGlobals();

		// 2. Initialize iterator with current seek position
		const initIterator = () => {
			const iterator = animationCallback();

			// Fast-forward to seekOffset if needed
			if (seekOffset > 0) {
				let t = 0;
				const dt = 1 / 60; // Simulation step

				while (t < seekOffset) {
					const step = Math.min(dt, seekOffset - t);
					const result = iterator.next(step);

					if (result.done) {
						if (onFinished) onFinished();
						return null;
					}

					t += step;
				}
			}

			return iterator;
		};

		// Always recreate iterator to match current seekOffset
		iteratorRef.current = initIterator();

		if (!iteratorRef.current) return;

		// --- RENDER MODE (Exporting) ---
		if (isRenderMode) {
			window.currentIterator = iteratorRef.current;
			if (window.onSceneReady) window.onSceneReady();
			return;
		}

		// --- PLAYBACK MODE (Browser) ---
		if (isPlaying) {
			let lastTime = performance.now();

			const loop = (now) => {
				const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap at 0.1s
				lastTime = now;

				const result = iteratorRef.current.next(dt);

				if (!result.done) {
					requestIdRef.current = requestAnimationFrame(loop);
				} else {
					if (onFinished) onFinished();
				}
			};

			requestIdRef.current = requestAnimationFrame(loop);
		} else {
		}

		return () => {
			if (requestIdRef.current) {
				cancelAnimationFrame(requestIdRef.current);
				requestIdRef.current = null;
			}
		};

		// Dependencies:
		// - animationCallback: Changes when scene changes
		// - isPlaying: Toggles playback on/off
		// - seekOffset: Updates position (causes iterator recreation)
	}, [animationCallback, isPlaying, seekOffset, onFinished]);
}
