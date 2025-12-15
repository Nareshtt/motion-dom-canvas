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

export * from "./components.jsx";

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
	// Regex to find function calls: name( or object access: name.
	const regex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*\(|\s*\.)/g;
	let match;
	while ((match = regex.exec(code)) !== null) {
		identifiers.add(match[1]);
	}

	const SAFE_GLOBALS = new Set([
		"console",
		"Math",
		"Date",
		"JSON",
		"Object",
		"Array",
		"String",
		"Number",
		"Boolean",
		"window",
		"document",
		"navigator",
		"performance",
		"requestAnimationFrame",
		"cancelAnimationFrame",
		"setTimeout",
		"clearTimeout",
		"setInterval",
		"clearInterval",
		"alert",
		"prompt",
		"confirm",
		"fetch",
	]);

	// 2. Mock missing globals
	const mocked = [];
	identifiers.forEach((id) => {
		if (SAFE_GLOBALS.has(id)) return;

		// Always mock for calculation, but save original if exists
		const original = window[id];

		const mockFn = (...args) => {
			// Assume last arg is duration if number, else 0
			const last = args[args.length - 1];
			const duration = typeof last === "number" ? last : 0;
			return tween(duration, () => {});
		};
		// Add mock .text method
		mockFn.text = (content, duration = 0) => tween(duration, () => {});

		window[id] = mockFn;
		mocked.push({ id, original });
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
		console.warn("Error calculating duration:", e);
		return 0;
	} finally {
		// 3. Cleanup
		mocked.forEach(({ id, original }) => {
			if (original === undefined) {
				delete window[id];
			} else {
				window[id] = original;
			}
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

export function setupGlobals() {
	// Clear existing globals first
	const existingIds = Object.keys(window).filter((key) => {
		const el = document.getElementById(key);
		return el !== null;
	});

	// Setup new globals
	const elements = document.querySelectorAll("[id]");
	console.log(
		`🔧 setupGlobals found ${elements.length} elements:`,
		Array.from(elements).map((e) => e.id)
	);

	elements.forEach((el) => {
		const animateFn = (...args) => createAnimation(el.id, ...args);

		// Attach .text() helper
		animateFn.text = (newText, duration = 1) => {
			return tween(duration, (t) => {
				const element = document.getElementById(el.id);
				if (!element) return;

				// If duration is very short (like in a loop), just set the text immediately at the end
				if (duration < 0.1) {
					if (t === 1) element.innerText = newText;
					return;
				}

				// Scramble Effect
				const length = Math.floor(t * newText.length);
				const visiblePart = newText.substring(0, length);
				const remaining = newText.length - length;
				let randomPart = "";
				const chars =
					"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for (let i = 0; i < Math.min(remaining, 3); i++) {
					randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
				}
				element.innerText = visiblePart + randomPart;
			});
		};

		window[el.id] = animateFn;
		console.log(
			`  - Registered global for ID: ${el.id}${
				animateFn.text ? " (with .text)" : ""
			}`
		);
	});
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

// Store initial styles for reset
const initialStyles = new Map();

function captureInitialStyles() {
	// Clear old styles from previous scenes
	initialStyles.clear();

	document.querySelectorAll("[id]").forEach((el) => {
		const computed = window.getComputedStyle(el);
		initialStyles.set(el.id, {
			opacity: computed.opacity,
			transform: computed.transform,
			translate: computed.translate,
			rotate: computed.rotate,
			scale: computed.scale,
			backgroundColor: computed.backgroundColor,
			color: computed.color,
			borderRadius: computed.borderRadius,
			filter: computed.filter,
			// Store gradient variables
			gradientFrom: computed.getPropertyValue("--tw-gradient-from"),
			gradientVia: computed.getPropertyValue("--tw-gradient-via"),
			gradientTo: computed.getPropertyValue("--tw-gradient-to"),
		});
	});
}

function resetAllElements() {
	document.querySelectorAll("[id]").forEach((el) => {
		// Clear all inline styles set by animations
		const propsToReset = [
			"opacity",
			"transform",
			"translate",
			"rotate",
			"scale",
			"backgroundColor",
			"color",
			"borderRadius",
			"filter",
			"width",
			"height",
			"margin",
			"padding",
		];

		propsToReset.forEach((prop) => {
			el.style[prop] = "";
		});

		// Reset gradient variables
		el.style.removeProperty("--tw-gradient-from");
		el.style.removeProperty("--tw-gradient-via");
		el.style.removeProperty("--tw-gradient-to");
	});
}

// --- THE CRITICAL useScene HOOK - FIXED FOR SMOOTH SEEKING ---

export function useScene(
	animationCallback,
	onFinished,
	isPlaying = true,
	seekOffset = 0
) {
	const iteratorRef = useRef(null);
	const requestIdRef = useRef(null);
	const iteratorTimeRef = useRef(0);
	const prevSeekOffsetRef = useRef(seekOffset);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;

		const urlParams = new URLSearchParams(window.location.search);
		const isRenderMode = urlParams.get("render") === "true";

		// CRITICAL: Setup globals for THIS scene's elements
		setupGlobals();

		// Capture initial styles for THIS scene
		captureInitialStyles();

		const initIterator = (targetTime) => {
			// CRITICAL: Reset all elements to their initial state before seeking
			resetAllElements();

			const iterator = animationCallback();
			let currentTime = 0;

			if (targetTime > 0) {
				// Fast-forward to target time
				const dt = 1 / 60;
				while (currentTime < targetTime) {
					const step = Math.min(dt, targetTime - currentTime);
					const result = iterator.next(step);
					if (result.done) {
						if (onFinished && isPlaying && mountedRef.current) onFinished();
						return null;
					}
					currentTime += step;
				}
			}
			iteratorTimeRef.current = currentTime;
			return iterator;
		};

		// --- RENDER MODE (Exporting) ---
		if (isRenderMode) {
			if (!iteratorRef.current) {
				iteratorRef.current = initIterator(0);

				if (isPlaying) {
					window.currentIterator = iteratorRef.current;
					if (window.onSceneReady) window.onSceneReady();
				}
			}
			return;
		}

		// --- PLAYBACK MODE (Browser) ---

		// Check if we need to seek (user dragged timeline or clicked)
		const seekDiff = Math.abs(prevSeekOffsetRef.current - seekOffset);
		const isSeekingBackwards = seekOffset < prevSeekOffsetRef.current;
		const needsSeek = seekDiff > 0.016; // ~1 frame tolerance at 60fps

		if (needsSeek) {
			// Cancel any ongoing animation
			if (requestIdRef.current) {
				cancelAnimationFrame(requestIdRef.current);
				requestIdRef.current = null;
			}

			// Always reinitialize when seeking backwards or large jumps
			if (isSeekingBackwards || seekDiff > 0.1) {
				console.log(
					`🔄 Reinitializing scene at ${seekOffset.toFixed(
						2
					)}s (backwards=${isSeekingBackwards})`
				);
			}

			// Reinitialize at the new position
			iteratorRef.current = initIterator(seekOffset);
			prevSeekOffsetRef.current = seekOffset;

			// If paused, we're done - the scene is now at the correct position
			if (!isPlaying) {
				return;
			}
		}

		if (!iteratorRef.current) {
			iteratorRef.current = initIterator(seekOffset);
			prevSeekOffsetRef.current = seekOffset;
		}

		if (isPlaying) {
			let lastTime = performance.now();

			const loop = (now) => {
				// Check if component is still mounted
				if (!mountedRef.current) return;

				const dt = Math.min((now - lastTime) / 1000, 0.1);
				lastTime = now;

				if (!iteratorRef.current) return;

				const result = iteratorRef.current.next(dt);
				iteratorTimeRef.current += dt;
				prevSeekOffsetRef.current = iteratorTimeRef.current;

				if (!result.done) {
					requestIdRef.current = requestAnimationFrame(loop);
				} else {
					if (onFinished && mountedRef.current) onFinished();
				}
			};

			requestIdRef.current = requestAnimationFrame(loop);
		}

		return () => {
			mountedRef.current = false;
			if (requestIdRef.current) {
				cancelAnimationFrame(requestIdRef.current);
				requestIdRef.current = null;
			}
			// Clear the iterator when unmounting
			iteratorRef.current = null;
		};
	}, [animationCallback, isPlaying, seekOffset, onFinished]);
}
