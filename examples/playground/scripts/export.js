import { createServer } from "vite";
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// --- CONFIG ---
const FPS = 60;
const OUTPUT_DIR = "output-frames";
const VIDEO_FILE = "output.mp4";

async function exportVideo() {
	console.log("🚀 Starting MotionDOM Export...");

	// 1. Start the Vite Server
	console.log("🔌 Starting local server...");
	const server = await createServer({
		server: { port: 0 },
	});
	await server.listen();
	const { port } = server.config.server;
	const url = `http://localhost:${port}/?render=true`;
	console.log(`✅ Server ready at ${url}`);

	// 2. Setup Output Folder
	if (fs.existsSync(OUTPUT_DIR))
		fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	fs.mkdirSync(OUTPUT_DIR);

	// 3. Launch Browser
	console.log("📸 Launching browser...");
	const browser = await puppeteer.launch({
		headless: "new",
		defaultViewport: { width: 1920, height: 1080 },
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
		}, FPS);

		// Wait for any pending renders using setTimeout wrapped in evaluate
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
		if (frameCount > FPS * 600) {
			// 10 minutes max
			console.warn("\n⚠️  Reached safety limit of frames");
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
			String(FPS),
			"-i",
			`${OUTPUT_DIR}/%05d.png`,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-preset",
			"medium", // Add preset for better quality
			"-crf",
			"18", // Add CRF for better quality (lower = better, 18 is visually lossless)
			VIDEO_FILE,
		]);

		ffmpeg.stdout.on("data", (data) => {
			process.stdout.write(".");
		});

		ffmpeg.stderr.on("data", (data) => {
			// FFmpeg outputs to stderr, but it's not always errors
			const message = data.toString();
			if (message.includes("error") || message.includes("Error")) {
				console.error("FFmpeg error:", message);
			}
		});

		ffmpeg.on("close", (code) => {
			console.log(""); // New line after dots
			if (code === 0) resolve();
			else reject(new Error(`FFmpeg failed with code ${code}`));
		});
	});

	// 7. Remove Frames
	fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	console.log(`🎉 Done! Video saved to: ${VIDEO_FILE}`);
}

exportVideo().catch((err) => {
	console.error("❌ Export failed:", err);
	process.exit(1);
});
