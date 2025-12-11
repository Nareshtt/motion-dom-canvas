import React, { useState, useEffect, useRef } from "react";
import { useScene } from "@motion-dom/core";
import scenes from "virtual:motion-dom-scenes";
import { Play, Pause, SkipBack, SkipForward, Square } from "lucide-react";

// Timeline Component
function Timeline({
	scenes,
	currentScene,
	onSceneChange,
	isPlaying,
	onPlayPause,
	onStop,
	currentTime = 0,
	totalDuration = 10,
}) {
	const [hoveredScene, setHoveredScene] = useState(null);
	const timelineRef = useRef(null);

	const sceneDurations = scenes.map((_, i) => totalDuration / scenes.length);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		const frames = Math.floor((seconds % 1) * 30);
		return `${mins}:${secs.toString().padStart(2, "0")}:${frames
			.toString()
			.padStart(2, "0")}`;
	};

	const handleTimelineClick = (e) => {
		if (!timelineRef.current) return;
		const rect = timelineRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percent = x / rect.width;
		const targetTime = percent * totalDuration;

		let accumulatedTime = 0;
		for (let i = 0; i < sceneDurations.length; i++) {
			accumulatedTime += sceneDurations[i];
			if (targetTime <= accumulatedTime) {
				onSceneChange(i);
				break;
			}
		}
	};

	return (
		<div
			className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 shadow-2xl"
			style={{ height: "180px" }}
		>
			{/* Controls Bar */}
			<div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<button
						onClick={onStop}
						className="p-2 hover:bg-zinc-800 rounded transition-colors"
						title="Stop"
					>
						<Square size={18} className="text-zinc-400" />
					</button>
					<button
						onClick={() => onSceneChange(Math.max(0, currentScene - 1))}
						className="p-2 hover:bg-zinc-800 rounded transition-colors"
						title="Previous Scene"
					>
						<SkipBack size={18} className="text-zinc-400" />
					</button>
					<button
						onClick={onPlayPause}
						className="p-2 hover:bg-blue-600 bg-blue-500 rounded transition-colors"
						title={isPlaying ? "Pause" : "Play"}
					>
						{isPlaying ? (
							<Pause size={18} className="text-white" />
						) : (
							<Play size={18} className="text-white" />
						)}
					</button>
					<button
						onClick={() =>
							onSceneChange(Math.min(scenes.length - 1, currentScene + 1))
						}
						className="p-2 hover:bg-zinc-800 rounded transition-colors"
						title="Next Scene"
					>
						<SkipForward size={18} className="text-zinc-400" />
					</button>
				</div>

				<div className="flex items-center gap-3">
					<span className="text-sm font-mono text-zinc-400">
						{formatTime(currentTime)}
					</span>
					<span className="text-xs text-zinc-600">/</span>
					<span className="text-sm font-mono text-zinc-500">
						{formatTime(totalDuration)}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-zinc-500">
						Scene {currentScene + 1} / {scenes.length}
					</span>
				</div>
			</div>

			{/* Timeline Track */}
			<div className="h-20 bg-zinc-900 px-4 py-3">
				<div
					ref={timelineRef}
					onClick={handleTimelineClick}
					className="relative h-full bg-zinc-950 rounded cursor-pointer overflow-hidden border border-zinc-800"
				>
					{scenes.map((scene, i) => {
						const startPercent =
							(sceneDurations.slice(0, i).reduce((a, b) => a + b, 0) /
								totalDuration) *
							100;
						const widthPercent = (sceneDurations[i] / totalDuration) * 100;
						const isActive = i === currentScene;
						const isHovered = i === hoveredScene;

						return (
							<div
								key={i}
								onMouseEnter={() => setHoveredScene(i)}
								onMouseLeave={() => setHoveredScene(null)}
								className={`absolute top-0 bottom-0 border-r border-zinc-800 transition-colors ${
									isActive
										? "bg-blue-600/30"
										: isHovered
										? "bg-zinc-800"
										: "bg-zinc-900/50"
								}`}
								style={{
									left: `${startPercent}%`,
									width: `${widthPercent}%`,
								}}
							>
								<div className="absolute inset-0 flex items-center justify-center">
									<span
										className={`text-xs font-medium ${
											isActive ? "text-blue-300" : "text-zinc-500"
										}`}
									>
										{i + 1}
									</span>
								</div>
								{isActive && (
									<div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
								)}
							</div>
						);
					})}

					{/* Playhead */}
					<div
						className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
						style={{ left: `${(currentTime / totalDuration) * 100}%` }}
					>
						<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm"></div>
					</div>
				</div>
			</div>

			{/* Scene List */}
			<div className="h-[calc(180px-128px)] bg-zinc-950 border-t border-zinc-800 overflow-y-auto">
				<div className="grid grid-cols-1 gap-px">
					{scenes.map((scene, i) => (
						<div
							key={i}
							onClick={() => onSceneChange(i)}
							onMouseEnter={() => setHoveredScene(i)}
							onMouseLeave={() => setHoveredScene(null)}
							className={`px-4 py-1.5 cursor-pointer transition-colors ${
								i === currentScene
									? "bg-blue-600/20 border-l-2 border-blue-500"
									: hoveredScene === i
									? "bg-zinc-800/50"
									: "bg-zinc-950"
							}`}
						>
							<div className="flex items-center justify-between">
								<span
									className={`text-sm ${
										i === currentScene
											? "text-blue-300 font-medium"
											: "text-zinc-400"
									}`}
								>
									Scene {i + 1}
								</span>
								<span className="text-xs text-zinc-600 font-mono">
									{formatTime(
										sceneDurations.slice(0, i).reduce((a, b) => a + b, 0)
									)}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// Main App
function App() {
	const [sceneIndex, setSceneIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);
	const startTimeRef = useRef(null);

	const handleSceneFinish = () => {
		if (sceneIndex < scenes.length - 1) {
			console.log(`🎬 Scene ${sceneIndex} finished. Playing next...`);
			setSceneIndex((prev) => prev + 1);
			startTimeRef.current = null; // Reset time for next scene
		} else {
			console.log("✅ All scenes finished.");
			setIsPlaying(false);
		}
	};

	const handleSceneChange = (newIndex) => {
		if (newIndex >= 0 && newIndex < scenes.length) {
			setSceneIndex(newIndex);
			startTimeRef.current = null;
			setIsPlaying(true);
		}
	};

	const handleStop = () => {
		setIsPlaying(false);
		setSceneIndex(0);
		setCurrentTime(0);
		startTimeRef.current = null;
	};

	// Track time during playback
	useEffect(() => {
		if (!isPlaying) return;

		const interval = setInterval(() => {
			setCurrentTime((t) => t + 0.033); // ~30fps
		}, 33);

		return () => clearInterval(interval);
	}, [isPlaying]);

	if (!scenes[sceneIndex]) {
		return (
			<div className="flex items-center justify-center w-full h-screen bg-black text-white">
				{scenes.length === 0 ? "No scenes found." : "End of presentation."}
			</div>
		);
	}

	// Calculate total duration (estimate 5 seconds per scene)
	const totalDuration = scenes.length * 5;

	return (
		<div className="w-full h-screen" style={{ paddingBottom: "180px" }}>
			<SceneWrapper
				key={sceneIndex}
				scene={scenes[sceneIndex]}
				onFinished={handleSceneFinish}
				isPlaying={isPlaying}
			/>

			<Timeline
				scenes={scenes}
				currentScene={sceneIndex}
				onSceneChange={handleSceneChange}
				isPlaying={isPlaying}
				onPlayPause={() => setIsPlaying(!isPlaying)}
				onStop={handleStop}
				currentTime={currentTime}
				totalDuration={totalDuration}
			/>
		</div>
	);
}

function SceneWrapper({ scene, onFinished, isPlaying }) {
	const { View, flow } = scene;

	// Only run animation if playing
	useScene(isPlaying ? flow : function* () {}, isPlaying ? onFinished : null);

	return <View />;
}

export default App;
