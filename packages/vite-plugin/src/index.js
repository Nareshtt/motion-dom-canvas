import { globSync } from "glob";
import fs from "fs";
import { parse } from "@babel/parser";

function getDurationFromNode(node) {
	if (!node) return 0;

	// Handle yield* expression
	if (node.type === "YieldExpression") {
		return getDurationFromNode(node.argument);
	}

	// Handle function calls
	if (node.type === "CallExpression") {
		const callee = node.callee;
		let name = null;

		if (callee.type === "Identifier") {
			name = callee.name;
		} else if (callee.type === "MemberExpression") {
			// Handle object.method() calls like label.text()
			name = callee.property.name;
		}

		// yield* all(...) -> Max duration of children
		if (name === "all") {
			const durations = node.arguments.map(getDurationFromNode);
			return Math.max(0, ...durations);
		}

		// yield* chain(...) -> Sum duration of children
		if (name === "chain") {
			const durations = node.arguments.map(getDurationFromNode);
			return durations.reduce((a, b) => a + b, 0);
		}

		// yield* waitFor(time) -> time
		if (name === "waitFor") {
			const arg = node.arguments[0];
			return arg && arg.type === "NumericLiteral" ? arg.value : 0;
		}

		// yield* delay(time, task) -> time + task duration
		if (name === "delay") {
			const timeArg = node.arguments[0];
			const taskArg = node.arguments[1];
			const delayTime =
				timeArg && timeArg.type === "NumericLiteral" ? timeArg.value : 0;
			const taskDuration = getDurationFromNode(taskArg);
			return delayTime + taskDuration;
		}

		// .text(content, duration)
		if (name === "text") {
			if (node.arguments.length >= 2) {
				const durationArg = node.arguments[1];
				if (durationArg && durationArg.type === "NumericLiteral") {
					return durationArg.value;
				}
			}
			return 0;
		}

		// Animation helper calls: helper(..., duration)
		// 1. Check if 2nd argument is a number (common for signals/text: val(target, duration))
		if (node.arguments.length >= 2) {
			const secondArg = node.arguments[1];
			if (secondArg && secondArg.type === "NumericLiteral") {
				return secondArg.value;
			}
		}

		// 2. Check if last argument is a number (common for element helpers: box(classes, duration))
		if (node.arguments.length > 0) {
			const lastArg = node.arguments[node.arguments.length - 1];
			if (lastArg && lastArg.type === "NumericLiteral") {
				return lastArg.value;
			}
		}
	}

	// Handle Loops (ForStatement)
	if (node.type === "ForStatement") {
		// Try to estimate loop count
		let iterations = 1;

		// Check init: let i = 1
		let start = 0;
		if (
			node.init &&
			node.init.type === "VariableDeclaration" &&
			node.init.declarations.length > 0
		) {
			const initVal = node.init.declarations[0].init;
			if (initVal && initVal.type === "NumericLiteral") start = initVal.value;
		}

		// Check test: i <= 5
		let end = 1;
		if (
			node.test &&
			node.test.type === "BinaryExpression" &&
			node.test.right.type === "NumericLiteral"
		) {
			end = node.test.right.value;
		}

		iterations = Math.max(1, end - start + 1);

		// Calculate body duration
		let bodyDuration = 0;
		if (node.body.type === "BlockStatement") {
			node.body.body.forEach((stmt) => {
				if (stmt.type === "ExpressionStatement") {
					bodyDuration += getDurationFromNode(stmt.expression);
				}
			});
		}

		return bodyDuration * iterations;
	}

	return 0;
}

function calculateFlowDuration(code) {
	try {
		const ast = parse(code, {
			sourceType: "module",
			plugins: ["jsx"],
		});

		let totalDuration = 0;

		// Find the 'flow' function
		const flowFn = ast.program.body.find(
			(node) =>
				node.type === "ExportNamedDeclaration" &&
				node.declaration &&
				node.declaration.type === "FunctionDeclaration" &&
				node.declaration.id &&
				node.declaration.id.name === "flow"
		);

		if (!flowFn || !flowFn.declaration.body.body) {
			console.warn("⚠️  No flow function found or empty body");
			return 10; // Fallback
		}

		// Process each statement in the flow function
		let transition = null;
		flowFn.declaration.body.body.forEach((stmt, index) => {
			if (stmt.type === "ExpressionStatement") {
				const duration = getDurationFromNode(stmt.expression);
				totalDuration += duration;

				// Check for transition at the start
				if (index === 0 && stmt.expression.type === "YieldExpression") {
					const arg = stmt.expression.argument;
					if (arg && arg.type === "CallExpression") {
						const callee = arg.callee;
						const name = callee.type === "Identifier" ? callee.name : null;
						if (name === "slide" || name === "fade" || name === "zoom") {
							transition = {
								type: name,
								duration: duration,
							};
						}
					}
				}
			} else if (stmt.type === "ForStatement") {
				totalDuration += getDurationFromNode(stmt);
			}
		});

		return { duration: totalDuration, transition };
	} catch (e) {
		console.error("Failed to parse scene for duration:", e);
		return { duration: 10, transition: null }; // Fallback
	}
}

export default function motionDom() {
	const virtualModuleId = "virtual:motion-dom-scenes";
	const resolvedVirtualModuleId = "\0" + virtualModuleId;

	return {
		name: "motion-dom-plugin",

		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},

		load(id) {
			if (id === resolvedVirtualModuleId) {
				// 1. Find all scene files
				const files = globSync("src/scenes/*/scene.jsx").map((f) =>
					f.replace(/\\/g, "/")
				);

				console.log("🔍 [MotionDOM] Glob found files:", files);

				// 2. Parse and Validate Folder Names
				const parsedScenes = files.map((filePath) => {
					const parts = filePath.split("/");
					const folderName = parts[parts.length - 2];

					// Regex: Must start with digits, a hyphen, then the name
					const match = folderName.match(/^(\d+)-(.*)$/);

					if (!match) {
						console.error(`❌ [MotionDOM] Invalid folder: ${folderName}`);
						throw new Error(
							`\n❌ [MotionDOM] Invalid scene folder: "${folderName}"\n` +
								`   Scene folders must follow the format "NUMBER-NAME" (e.g., "1-intro").\n` +
								`   Found at: ${filePath}\n`
						);
					}

					// Calculate Duration Statically
					const code = fs.readFileSync(filePath, "utf-8");
					const { duration, transition } = calculateFlowDuration(code);

					console.log(
						`⏱️  Scene "${match[2]}" (${folderName}): ${duration}s${
							transition ? ` [Transition: ${transition.type}]` : ""
						}`
					);

					return {
						index: parseInt(match[1], 10),
						name: match[2],
						path: filePath,
						folderName,
						duration,
						transition,
					};
				});

				// 3. Sort by Index
				parsedScenes.sort((a, b) => a.index - b.index);

				// 4. Validation: Check for duplicates and gaps
				parsedScenes.forEach((scene, i) => {
					const expectedIndex = i + 1;

					if (scene.index !== expectedIndex) {
						const isDuplicate = parsedScenes.find(
							(s) => s.index === scene.index && s !== scene
						);

						if (isDuplicate) {
							throw new Error(
								`\n❌ [MotionDOM] Duplicate scene number: "${scene.index}"\n` +
									`   1. ${scene.folderName}\n` +
									`   2. ${isDuplicate.folderName}\n` +
									`   Please change one of them.\n`
							);
						} else {
							throw new Error(
								`\n❌ [MotionDOM] Missing scene number: ${expectedIndex}\n` +
									`   You have scene #${
										expectedIndex - 1
									} and then jumped to #${scene.index}.\n` +
									`   Please rename "${scene.folderName}" to start with "${expectedIndex}-".\n`
							);
						}
					}
				});

				console.log(
					`🎬 MotionDOM: Loaded ${parsedScenes.length} scenes in correct order.`
				);
				console.log(
					`📊 Total duration: ${parsedScenes.reduce(
						(a, b) => a + b.duration,
						0
					)}s`
				);

				// 5. Check for Audio
				const audioExtensions = ["mp3", "wav", "ogg"];
				let audioPath = null;
				for (const ext of audioExtensions) {
					const path = `src/audio/audio.${ext}`;
					if (fs.existsSync(path)) {
						audioPath = path;
						console.log(`🎵 [MotionDOM] Found audio: ${path}`);
						break;
					}
				}

				// 6. Generate Code
				const imports = parsedScenes
					.map((scene, i) => `import * as scene_${i} from '/${scene.path}';`)
					.join("\n");

				const audioImport = audioPath
					? `import audioUrl from '/${audioPath}';`
					: "const audioUrl = null;";

				const exports = `export default {
					scenes: [${parsedScenes
						.map(
							(scene, i) =>
								`{ ...scene_${i}, name: "${scene.name}", duration: ${
									scene.duration
								}, transition: ${JSON.stringify(scene.transition)} }`
						)
						.join(", ")}],
					audio: audioUrl
				};`;

				return `${imports}\n${audioImport}\n\n${exports}`;
			}
		},

		handleHotUpdate({ file, server }) {
			if (file.includes("scenes") && file.endsWith("scene.jsx")) {
				server.ws.send({ type: "full-reload" });
			}
		},
	};
}
