#!/usr/bin/env node

import { exportVideo } from "../src/index.js";

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === "--fps" && args[i + 1]) {
		options.fps = parseInt(args[++i], 10);
	} else if (arg === "--output" && args[i + 1]) {
		options.output = args[++i];
	} else if (arg === "--width" && args[i + 1]) {
		options.width = parseInt(args[++i], 10);
	} else if (arg === "--height" && args[i + 1]) {
		options.height = parseInt(args[++i], 10);
	} else if (arg === "--help" || arg === "-h") {
		console.log(`
MotionDOM Video Export

Usage: motion-dom-export [options]

Options:
  --fps <number>      Frames per second (default: 60)
  --output <file>     Output file path (default: output.mp4)
  --width <number>    Video width (default: 1920)
  --height <number>   Video height (default: 1080)
  --help, -h          Show this help message

Prerequisites:
  - FFmpeg must be installed and available in PATH

Examples:
  motion-dom-export
  motion-dom-export --fps 30 --output video.mp4
  motion-dom-export --width 1280 --height 720
`);
		process.exit(0);
	}
}

exportVideo(options).catch((err) => {
	console.error("❌ Export failed:", err);
	process.exit(1);
});
