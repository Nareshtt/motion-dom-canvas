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
		server: { port: 0 }, // 0 = random available port
	});
	await server.listen();
	const { port } = server.config.server;
	const url = `http://localhost:${port}/?render=true`;
	console.log(`✅ Server ready at ${url}`);

	// 2. Setup Output Folder
	if (fs.existsSync(OUTPUT_DIR))
		fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	fs.mkdirSync(OUTPUT_DIR);

	// 3. Launch Browser (The Cameraman)
	console.log("📸 Launching browser...");
	const browser = await puppeteer.launch({
		headless: "new",
		defaultViewport: { width: 1920, height: 1080 }, // 1080p
	});
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: "networkidle0" });

	// 4. Capture Frames
	console.log("🎥 Rendering frames...");
	let frameCount = 0;
	let isFinished = false;

	while (!isFinished) {
		// Advance animation by 1 frame
		isFinished = await page.evaluate((fps) => window.nextFrame(fps), FPS);

		// Take screenshot
		const fileName = String(frameCount).padStart(5, "0") + ".png";
		await page.screenshot({ path: path.join(OUTPUT_DIR, fileName) });

		process.stdout.write(`\r   Frames: ${frameCount} `);
		frameCount++;
	}
	console.log("\n✅ Capture complete.");

	// 5. Cleanup Browser & Server
	await browser.close();
	await server.close();

	// 6. Convert to MP4 with FFmpeg
	console.log("🎞️  Encoding video...");

	await new Promise((resolve, reject) => {
		const ffmpeg = spawn("ffmpeg", [
			"-y", // Overwrite output
			"-framerate",
			String(FPS), // Input framerate
			"-i",
			`${OUTPUT_DIR}/%05d.png`, // Input pattern
			"-c:v",
			"libx264", // Codec
			"-pix_fmt",
			"yuv420p", // Pixel format
			VIDEO_FILE, // Output file
		]);

		ffmpeg.on("close", (code) => {
			if (code === 0) resolve();
			else reject(new Error("FFmpeg failed"));
		});
	});

	// 7. Remove Frames
	fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	console.log(`🎉 Done! Video saved to: ${VIDEO_FILE}`);
}

exportVideo().catch((err) => {
	console.error(err);
	process.exit(1);
});
