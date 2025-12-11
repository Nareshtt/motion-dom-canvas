import { useEffect } from "react";
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

export function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
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

export function* tween(duration, onUpdate) {
	let time = 0;
	while (time < duration) {
		const dt = yield;
		time += dt || 0;
		const progress = Math.min(time / duration, 1);
		onUpdate(progress);
	}
	onUpdate(1);
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

export function* delay(seconds, task) {
	yield* waitFor(seconds);
	yield* task;
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
				console.log(`📌 Got ${prop} from inline style:`, color);
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

	console.log(`🔍 Found current class: ${gradientClass}`);

	// Extract color name and resolve it
	const colorName = extractColorFromGradientClass(gradientClass);
	if (colorName) {
		const bgClass = `bg-${colorName}`;
		console.log(`🎨 Resolving ${gradientClass} as ${bgClass}`);
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
			console.log(
				`⚠️ No gradient color found for ${prop}, using backgroundColor`
			);
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
		console.error("animate needs 2+ args");
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

	console.log(`\n🎬 Animating ${id} to: ${toString}`);

	const tasks = [];

	toClasses.forEach((toClass, index) => {
		const propDef = getPropertyFromClass(toClass);
		if (!propDef) return;
		const { prop, unit } = propDef;

		console.log(`\n🔧 Processing ${toClass} -> ${prop}`);

		// Get START value
		let startVal;
		if (fromClasses.length > index) {
			const fromClass = fromClasses[index];
			console.log(`📍 START from explicit class: ${fromClass}`);

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
			console.log(`📍 START from current value`);
			startVal = getCurrentValue(el, prop, unit);
		}

		// Get END value
		let endVal;
		console.log(`🎯 END from class: ${toClass}`);

		if (unit === "color") {
			// For gradient classes, extract the color part
			if (
				toClass.startsWith("from-") ||
				toClass.startsWith("to-") ||
				toClass.startsWith("via-")
			) {
				const colorName = extractColorFromGradientClass(toClass);
				const bgClass = `bg-${colorName}`;
				console.log(`   Converting ${toClass} -> ${bgClass}`);
				endVal = resolveTailwindColor(bgClass, "backgroundColor");
			} else {
				endVal = resolveTailwindColor(toClass, prop);
			}
		} else {
			endVal = parseTailwindValue(toClass);
		}

		console.log(`   START:`, startVal);
		console.log(`   END:`, endVal);

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

function setupGlobals() {
	document.querySelectorAll("[id]").forEach((el) => {
		window[el.id] = (...args) => createAnimation(el.id, ...args);
	});
}

export function useScene(animationCallback, onFinished) {
	useEffect(() => {
		setupGlobals();
		const iterator = animationCallback();
		let isRunning = true;
		let lastTime = null;

		const loop = (time) => {
			if (!isRunning) return;
			if (lastTime === null) {
				lastTime = time;
				requestAnimationFrame(loop);
				return;
			}
			let dt = (time - lastTime) / 1000;
			lastTime = time;
			if (dt > 0.1) dt = 0.1;

			const result = iterator.next(dt);
			if (!result.done) requestAnimationFrame(loop);
			else if (onFinished) onFinished();
		};
		requestAnimationFrame(loop);
		return () => {
			isRunning = false;
		};
	}, [animationCallback]);
}
