import React, { useState, useEffect, useRef } from "react";
import { useScene, calculateDuration } from "@motion-dom/core";
import projectData from "virtual:motion-dom-scenes";
import { Timeline } from "./components/Timeline";
import { Viewport } from "./components/Viewport";

// Main App
function App() {
	const [scenes, setScenes] = useState([]);
	const [audio, setAudio] = useState(null);
	const [volume, setVolume] = useState(1);
	const [sceneIndex, setSceneIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);
	const sceneIndexRef = useRef(0);
	const audioRef = useRef(null);

	// Check if we are in render mode (exporting)
	const [isRenderMode] = useState(() => {
		if (typeof window !== "undefined") {
			const urlParams = new URLSearchParams(window.location.search);
			return urlParams.get("render") === "true";
		}
		return false;
	});

	// Calculate durations on mount
	useEffect(() => {
		console.log("Calculating scene durations...");
		const processedScenes = projectData.scenes.map((scene) => {
			const duration = calculateDuration(scene.flow);
			console.log(`Scene ${scene.name} duration: ${duration}s`);
			return { ...scene, duration };
		});
		setScenes(processedScenes);
		setAudio(projectData.audio);
	}, []);

	// Sync ref with state
	useEffect(() => {
		sceneIndexRef.current = sceneIndex;
	}, [sceneIndex]);

	// Audio Sync Effect
	useEffect(() => {
		if (!audioRef.current || isRenderMode) return;

		audioRef.current.volume = volume;

		if (isPlaying) {
			// Sync audio to current time if it drifted
			if (Math.abs(audioRef.current.currentTime - currentTime) > 0.1) {
				audioRef.current.currentTime = currentTime;
			}
			audioRef.current
				.play()
				.catch((e) => console.warn("Audio play failed:", e));
		} else {
			audioRef.current.pause();
		}
	}, [isPlaying, audio, volume]);

	const handleSceneFinish = () => {
		if (sceneIndex < scenes.length - 1) {
			console.log(`🎬 Scene ${sceneIndex} finished. Playing next...`);
			setSceneIndex((prev) => prev + 1);
			// Don't reset currentTime - let it flow naturally through scenes
		} else {
			console.log("✅ All scenes finished.");
			setIsPlaying(false);
		}
	};

	// Update currentTime during playback using high-precision timer
	useEffect(() => {
		if (!isPlaying || isRenderMode) return;

		let animationFrameId;
		let lastTime = performance.now();

		const updateTime = (now) => {
			const dt = (now - lastTime) / 1000; // Convert to seconds
			lastTime = now;

			setCurrentTime((prev) => {
				const newTime = prev + dt;
				// Clamp to total duration
				const totalDuration = scenes.reduce(
					(acc, s) => acc + (s.duration || 0),
					0
				);
				return Math.min(newTime, totalDuration);
			});

			animationFrameId = requestAnimationFrame(updateTime);
		};

		animationFrameId = requestAnimationFrame(updateTime);

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [isPlaying, scenes, isRenderMode]);

	// Export Logic
	useEffect(() => {
		if (isRenderMode && scenes.length > 0) {
			window.nextFrame = async (fps) => {
				if (!window.currentIterator) return false;

				const dt = 1 / fps;
				const result = window.currentIterator.next(dt);

				if (result.done) {
					// Scene finished
					if (sceneIndexRef.current < scenes.length - 1) {
						console.log("🎬 Scene finished (export). Moving to next...");

						// Trigger next scene
						setSceneIndex((prev) => prev + 1);

						// Wait for next scene to mount and set window.currentIterator
						await new Promise((resolve) => {
							window.onSceneReady = () => {
								window.onSceneReady = null;
								resolve();
							};
						});

						return false; // Continue capturing
					} else {
						return true; // All done
					}
				}
				return false;
			};
		}
	}, [isRenderMode, scenes]);

	const handleSeek = (time) => {
		console.log(`🎯 Seeking to ${time.toFixed(2)}s`);

		// Update global time
		setCurrentTime(time);

		// Sync Audio
		if (audioRef.current) {
			audioRef.current.currentTime = time;
		}

		// Find which scene this time belongs to
		let accumulatedTime = 0;
		for (let i = 0; i < scenes.length; i++) {
			const sceneDuration = scenes[i].duration || 10;
			if (time >= accumulatedTime && time < accumulatedTime + sceneDuration) {
				if (sceneIndex !== i) {
					console.log(`  → Switching to scene ${i}`);
					setSceneIndex(i);
				}
				break;
			}
			accumulatedTime += sceneDuration;
		}
	};

	const handleStop = () => {
		console.log("⏹️  Stopped");
		setIsPlaying(false);
		setCurrentTime(0);
		setSceneIndex(0);
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	};

	if (!scenes || scenes.length === 0) {
		return (
			<div className="flex items-center justify-center w-full h-screen bg-black text-white">
				Loading scenes...
			</div>
		);
	}

	// Calculate total duration
	const totalDuration = scenes.reduce(
		(acc, scene) => acc + (scene.duration || 0),
		0
	);

	// Calculate offset for current scene
	const sceneStart = scenes
		.slice(0, sceneIndex)
		.reduce((acc, s) => acc + (s.duration || 0), 0);
	const sceneOffset = Math.max(0, currentTime - sceneStart);

	return (
		<div className="w-full h-screen flex flex-col bg-black overflow-hidden relative">
			{/* Audio Element */}
			{audio && <audio ref={audioRef} src={audio} />}

			{/* Viewport */}
			<div className="viewport-export-target flex-1 relative overflow-hidden flex flex-col min-h-0 bg-black">
				<Viewport>
					{/* Previous Scene (during transition) */}
					{scenes[sceneIndex]?.transition &&
						sceneIndex > 0 &&
						sceneOffset < scenes[sceneIndex].transition.duration && (
							<div className="absolute inset-0 z-0">
								<SceneWrapper
									key={sceneIndex - 1}
									scene={scenes[sceneIndex - 1]}
									onFinished={() => {}}
									isPlaying={false}
									seekOffset={scenes[sceneIndex - 1].duration || 0} // Show end state
								/>
							</div>
						)}

					{/* Current Scene */}
					<div
						className="absolute inset-0 z-10"
						style={
							scenes[sceneIndex]?.transition &&
							sceneOffset < scenes[sceneIndex].transition.duration
								? getTransitionStyle(
										scenes[sceneIndex].transition.type,
										sceneOffset / scenes[sceneIndex].transition.duration
								  )
								: { transform: "none", opacity: 1 }
						}
					>
						<SceneWrapper
							key={sceneIndex}
							scene={scenes[sceneIndex]}
							onFinished={handleSceneFinish}
							isPlaying={isPlaying}
							seekOffset={isRenderMode ? 0 : sceneOffset}
						/>
					</div>
				</Viewport>
			</div>

			{/* Timeline */}
			{!isRenderMode && (
				<Timeline
					scenes={scenes}
					audio={audio}
					volume={volume}
					onVolumeChange={setVolume}
					currentScene={sceneIndex}
					onSceneChange={(index) => {
						console.log(`📍 Jumping to scene ${index}`);
						setSceneIndex(index);
						// Calculate the start time of this scene
						const newTime = scenes
							.slice(0, index)
							.reduce((acc, s) => acc + (s.duration || 0), 0);
						setCurrentTime(newTime);
						if (audioRef.current) {
							audioRef.current.currentTime = newTime;
						}
					}}
					isPlaying={isPlaying}
					onPlayPause={() => {
						if (!isPlaying) {
							console.log(`▶️  Resuming from ${currentTime.toFixed(2)}s`);
						} else {
							console.log(`⏸️  Paused at ${currentTime.toFixed(2)}s`);
						}
						setIsPlaying(!isPlaying);
					}}
					onStop={handleStop}
					currentTime={currentTime}
					totalDuration={totalDuration}
					onSeek={handleSeek}
				/>
			)}
		</div>
	);
}

function SceneWrapper({ scene, onFinished, isPlaying, seekOffset }) {
	const { View, flow } = scene;

	// Pass the animation to useScene hook
	// seekOffset tells it where in the scene we are (0 = start, duration = end)
	useScene(flow, isPlaying ? onFinished : null, isPlaying, seekOffset);

	// Render the scene view
	// Force re-mount when seeking to reset DOM state.
	// When playing, key is constant ("playing") to avoid remounts.
	// When paused (seeking), key changes with offset to force reset.
	return <View key={isPlaying ? "playing" : seekOffset} />;
}

function getTransitionStyle(type, progress) {
	if (type === "slide") {
		// Slide in from right
		return {
			transform: `translateX(${(1 - progress) * 100}%)`,
			opacity: 1,
		};
	}
	if (type === "fade") {
		// Fade in
		return {
			transform: "none",
			opacity: progress,
		};
	}
	if (type === "zoom") {
		// Zoom in from 0.5 to 1
		const scale = 0.5 + 0.5 * progress;
		return {
			transform: `scale(${scale})`,
			opacity: progress,
		};
	}
	return { transform: "none", opacity: 1 };
}

export default App;
