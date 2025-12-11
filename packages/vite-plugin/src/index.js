import { globSync } from "glob";

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
				// Normalize slashes immediately for Windows compatibility
				const files = globSync("src/scenes/*/scene.jsx").map((f) =>
					f.replace(/\\/g, "/")
				);

				// 2. Parse and Validate Folder Names
				const parsedScenes = files.map((filePath) => {
					// Extract parent folder name: src/scenes/1-intro/scene.jsx -> "1-intro"
					const parts = filePath.split("/");
					const folderName = parts[parts.length - 2];

					// Regex: Must start with digits, a hyphen, then the name
					const match = folderName.match(/^(\d+)-(.*)$/);

					if (!match) {
						throw new Error(
							`\n❌ [MotionDOM] Invalid scene folder: "${folderName}"\n` +
								`   Scene folders must follow the format "NUMBER-NAME" (e.g., "1-intro").\n` +
								`   Found at: ${filePath}\n`
						);
					}

					return {
						index: parseInt(match[1], 10),
						name: match[2],
						path: filePath, // Full path for import
						folderName, // Store for error messages
					};
				});

				// 3. Sort by Index (1, 2, 3...)
				parsedScenes.sort((a, b) => a.index - b.index);

				// 4. Validation: Check for duplicates and gaps
				parsedScenes.forEach((scene, i) => {
					const expectedIndex = i + 1; // We expect 1, 2, 3...

					if (scene.index !== expectedIndex) {
						// Check if it's a duplicate (two folders starting with '1-')
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
						}
						// Check if it's a gap (e.g. 1, 2, 4)
						else {
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

				// 5. Generate Code
				// We use the sorted list to generate imports
				const imports = parsedScenes
					.map((scene, i) => `import * as scene_${i} from '/${scene.path}';`)
					.join("\n");

				const exports = `export default [${parsedScenes
					.map((_, i) => `scene_${i}`)
					.join(", ")}];`;

				return `${imports}\n\n${exports}`;
			}
		},

		handleHotUpdate({ file, server }) {
			// Reload if any file inside a scenes folder changes
			if (file.includes("scenes") && file.endsWith("scene.jsx")) {
				server.ws.send({ type: "full-reload" });
			}
		},
	};
}
