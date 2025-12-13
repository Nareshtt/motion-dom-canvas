import { globSync } from "glob";
import fs from "fs";
import path from "path";

// Mock calculateFlowDuration (simplified)
function calculateFlowDuration(code) {
	return { duration: 10, transition: null };
}

console.log("CWD:", process.cwd());

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
		return null;
	}

	// Calculate Duration Statically
	const code = fs.readFileSync(filePath, "utf-8");
	const { duration, transition } = calculateFlowDuration(code);

	console.log(`⏱️  Scene "${match[2]}" (${folderName}): ${duration}s`);

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

console.log("Parsed Scenes:", parsedScenes);

// 6. Generate Code
const imports = parsedScenes
	.map((scene, i) => `import * as scene_${i} from '/${scene.path}';`)
	.join("\n");

console.log("Generated Imports:\n", imports);
