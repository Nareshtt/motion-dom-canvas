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

		// Signal that scenes are loaded (for export script)
		if (typeof window !== "undefined") {
			window.scenesLoaded = true;
		}
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
		} else {
			console.log("✅ All scenes finished.");
			setIsPlaying(false);
		}
	};

	// Update currentTime during playback
	useEffect(() => {
		if (!isPlaying || isRenderMode) return;

		let animationFrameId;
		let lastTime = performance.now();

		const updateTime = (now) => {
			const dt = (now - lastTime) / 1000;
			lastTime = now;

			setCurrentTime((prev) => {
				const newTime = prev + dt;
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

	// Export Logic - FIXED VERSION
	useEffect(() => {
		if (isRenderMode && scenes.length > 0) {
			let exportTime = 0; // Track total export time across all scenes

			window.nextFrame = async (fps) => {
				if (!window.currentIterator) {
					console.error("No current iterator!");
					return true;
				}

				const dt = 1 / fps;
				const result = window.currentIterator.next(dt);
				exportTime += dt;

				if (result.done) {
					// Scene finished
					if (sceneIndexRef.current < scenes.length - 1) {
						console.log(
							`🎬 Scene ${sceneIndexRef.current} finished (export). Moving to next...`
						);

						// Trigger next scene
						setSceneIndex((prev) => prev + 1);

						// Wait for next scene to mount and set window.currentIterator
						await new Promise((resolve) => {
							window.onSceneReady = () => {
								window.onSceneReady = null;
								resolve();
							};
							// Timeout safety
							setTimeout(resolve, 1000);
						});

						return false; // Continue capturing
					} else {
						console.log("🎉 All scenes exported!");
						return true; // All done
					}
				}
				return false;
			};
		}
	}, [isRenderMode, scenes]);

	const handleSeek = (time) => {
		setCurrentTime(time);

		if (audioRef.current) {
			audioRef.current.currentTime = time;
		}

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

	const currentSceneData = scenes[sceneIndex];

	// Check if scene is valid
	if (!currentSceneData || !currentSceneData.View || !currentSceneData.flow) {
		return (
			<div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white gap-4">
				<div className="text-red-500 text-xl font-bold">⚠️ Scene Error</div>
				<div className="text-zinc-400">
					Scene {sceneIndex} is missing View or flow export
				</div>
				<div className="text-sm text-zinc-600">
					Scene data: {JSON.stringify(currentSceneData?.name || "undefined")}
				</div>
			</div>
		);
	}

	const totalDuration = scenes.reduce(
		(acc, scene) => acc + (scene.duration || 0),
		0
	);

	const sceneStart = scenes
		.slice(0, sceneIndex)
		.reduce((acc, s) => acc + (s.duration || 0), 0);
	const sceneOffset = Math.max(0, currentTime - sceneStart);

	// In render mode, we don't render transitions separately
	// The transition is part of the scene's flow animation
	const shouldRenderTransition =
		!isRenderMode &&
		scenes[sceneIndex]?.transition &&
		sceneIndex > 0 &&
		sceneOffset < scenes[sceneIndex].transition.duration;

	return (
		<div className="w-full h-screen flex flex-col bg-black overflow-hidden relative">
			{audio && <audio ref={audioRef} src={audio} />}

			<div className="viewport-export-target flex-1 relative overflow-hidden flex flex-col min-h-0 bg-black">
				<Viewport>
					{/* Previous Scene (during transition - ONLY in playback mode) */}
					{shouldRenderTransition && (
						<div className="absolute inset-0 z-0">
							<SceneWrapper
								key={`prev-${sceneIndex - 1}`}
								scene={scenes[sceneIndex - 1]}
								onFinished={() => {}}
								isPlaying={false}
								seekOffset={scenes[sceneIndex - 1].duration || 0}
							/>
						</div>
					)}

					{/* Current Scene */}
					<div
						className="absolute inset-0 z-10"
						style={
							shouldRenderTransition
								? getTransitionStyle(
										scenes[sceneIndex].transition.type,
										sceneOffset / scenes[sceneIndex].transition.duration
								  )
								: { transform: "none", opacity: 1 }
						}
					>
						<SceneWrapper
							key={`scene-${sceneIndex}-${scenes[sceneIndex]?.name}`}
							scene={scenes[sceneIndex]}
							onFinished={handleSceneFinish}
							isPlaying={isPlaying}
							seekOffset={isRenderMode ? 0 : sceneOffset}
							isRenderMode={isRenderMode}
						/>
					</div>
				</Viewport>
			</div>

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

function SceneWrapper({
	scene,
	onFinished,
	isPlaying,
	seekOffset,
	isRenderMode,
}) {
	const { View, flow } = scene || {};

	// Safety check
	if (!View || !flow) {
		console.error("SceneWrapper: Invalid scene", scene);
		return (
			<div className="flex items-center justify-center w-full h-full bg-red-900/20 text-white">
				<div className="text-center">
					<div className="text-red-500 text-xl font-bold mb-2">Scene Error</div>
					<div className="text-sm">Missing View or flow export</div>
					<div className="text-xs text-zinc-500 mt-2">
						Scene: {scene?.name || "undefined"}
					</div>
				</div>
			</div>
		);
	}

	useScene(flow, isPlaying ? onFinished : null, isPlaying, seekOffset);

	// Don't use any key - let React handle the remounting via parent key
	return <View />;
}

function getTransitionStyle(type, progress) {
	if (type === "slide") {
		return {
			transform: `translateX(${(1 - progress) * 100}%)`,
			opacity: 1,
		};
	}
	if (type === "fade") {
		return {
			transform: "none",
			opacity: progress,
		};
	}
	if (type === "zoom") {
		const scale = 0.5 + 0.5 * progress;
		return {
			transform: `scale(${scale})`,
			opacity: progress,
		};
	}
	return { transform: "none", opacity: 1 };
}

export default App;
