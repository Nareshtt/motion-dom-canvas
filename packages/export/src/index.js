import { createServer } from "vite";
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Export a MotionDOM project to video
 * @param {Object} options - Export options
 * @param {number} options.fps - Frames per second (default: 60)
 * @param {string} options.output - Output file path (default: "output.mp4")
 * @param {number} options.width - Video width (default: 1920)
 * @param {number} options.height - Video height (default: 1080)
 * @param {string} options.cwd - Working directory (default: process.cwd())
 * @param {number} options.maxDuration - Maximum duration in seconds (default: 600)
 */
export async function exportVideo(options = {}) {
	const {
		fps = 60,
		output = "output.mp4",
		width = 1920,
		height = 1080,
		cwd = process.cwd(),
		maxDuration = 600,
	} = options;

	const OUTPUT_DIR = path.join(cwd, "output-frames");
	const VIDEO_FILE = path.join(cwd, output);

	console.log("🚀 Starting MotionDOM Export...");
	console.log(`   Resolution: ${width}x${height}`);
	console.log(`   FPS: ${fps}`);
	console.log(`   Output: ${output}`);

	// 1. Start the Vite Server
	console.log("🔌 Starting local server...");
	const server = await createServer({
		root: cwd,
		server: { port: 0 },
	});
	await server.listen();
	const { port } = server.config.server;
	const url = `http://localhost:${port}/?render=true`;
	console.log(`✅ Server ready at ${url}`);

	// 2. Setup Output Folder
	if (fs.existsSync(OUTPUT_DIR)) {
		fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	}
	fs.mkdirSync(OUTPUT_DIR);

	// 3. Launch Browser
	console.log("📸 Launching browser...");
	const browser = await puppeteer.launch({
		headless: "new",
		defaultViewport: { width, height },
	});
	const page = await browser.newPage();

	// Enable console logging from the page for debugging
	page.on("console", (msg) => {
		if (msg.text().includes("Scene") || msg.text().includes("transition")) {
			console.log("Browser:", msg.text());
		}
	});

	await page.goto(url, { waitUntil: "networkidle0" });

	// Wait for scenes to be loaded
	await page.waitForFunction(() => window.scenesLoaded === true, {
		timeout: 10000,
	});

	// 4. Capture Frames
	console.log("🎥 Rendering frames...");
	let frameCount = 0;
	let isFinished = false;

	while (!isFinished) {
		// Advance animation by 1 frame
		isFinished = await page.evaluate((fps) => {
			if (!window.nextFrame) {
				console.error("window.nextFrame not available");
				return true;
			}
			return window.nextFrame(fps);
		}, fps);

		// Wait for any pending renders
		await page.evaluate(
			() => new Promise((resolve) => setTimeout(resolve, 10))
		);

		// Take screenshot of the viewport-export-target
		const element = await page.$(".viewport-export-target");
		if (element) {
			const fileName = String(frameCount).padStart(5, "0") + ".png";
			await element.screenshot({ path: path.join(OUTPUT_DIR, fileName) });
		} else {
			console.error("Export target element not found");
			break;
		}

		process.stdout.write(`\r   Frames: ${frameCount} `);
		frameCount++;

		// Safety limit to prevent infinite loops
		if (frameCount > fps * maxDuration) {
			console.warn(`\n⚠️  Reached safety limit of ${maxDuration}s`);
			break;
		}
	}
	console.log("\n✅ Capture complete.");

	// 5. Cleanup Browser & Server
	await browser.close();
	await server.close();

	// 6. Convert to MP4 with FFmpeg
	console.log("🎞️  Encoding video...");

	await new Promise((resolve, reject) => {
		const ffmpeg = spawn("ffmpeg", [
			"-y",
			"-framerate",
			String(fps),
			"-i",
			`${OUTPUT_DIR}/%05d.png`,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-preset",
			"medium",
			"-crf",
			"18",
			VIDEO_FILE,
		]);

		ffmpeg.stdout.on("data", () => {
			process.stdout.write(".");
		});

		ffmpeg.stderr.on("data", (data) => {
			const message = data.toString();
			if (message.includes("error") || message.includes("Error")) {
				console.error("FFmpeg error:", message);
			}
		});

		ffmpeg.on("close", (code) => {
			console.log("");
			if (code === 0) resolve();
			else reject(new Error(`FFmpeg failed with code ${code}`));
		});
	});

	// 7. Remove Frames
	fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	console.log(`🎉 Done! Video saved to: ${output}`);

	return VIDEO_FILE;
}

export default exportVideo;
