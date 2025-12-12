import React, { useRef, useState, useEffect } from "react";
import {
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Square,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { Ruler } from "./Ruler";

export function Timeline({
	scenes,
	currentScene,
	onSceneChange,
	isPlaying,
	onPlayPause,
	onStop,
	currentTime,
	totalDuration,
	onSeek,
}) {
	const trackRef = useRef(null);
	const scrollContainerRef = useRef(null);

	// Zoom state: pixels per second. Default 100px = 1s
	const [zoom, setZoom] = useState(100);
	const [scrollLeft, setScrollLeft] = useState(0);
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Debug: Log scene durations on mount
	useEffect(() => {
		console.log("📊 Timeline Debug:");
		console.log("  Total scenes:", scenes.length);
		console.log("  Total duration:", totalDuration, "seconds");
		scenes.forEach((scene, i) => {
			console.log(`  Scene ${i} (${scene.name}): ${scene.duration}s`);
		});
	}, [scenes, totalDuration]);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		const frames = Math.floor((seconds % 1) * 30);
		return `${mins}:${secs.toString().padStart(2, "0")}:${frames
			.toString()
			.padStart(2, "0")}`;
	};

	// Handle Wheel for Zoom (Ctrl) and Scroll
	useEffect(() => {
		const element = scrollContainerRef.current;
		if (!element) return;

		const handleWheel = (e) => {
			if (e.ctrlKey) {
				e.preventDefault();
				e.stopPropagation();

				const zoomFactor = 1.1;
				const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
				const clampedZoom = Math.max(10, Math.min(newZoom, 1000));

				// Zoom towards mouse pointer
				const rect = element.getBoundingClientRect();
				const mouseX = e.clientX - rect.left;
				const timeAtMouse = (scrollLeft + mouseX) / zoom;

				const newScrollLeft = timeAtMouse * clampedZoom - mouseX;

				setZoom(clampedZoom);
				setScrollLeft(Math.max(0, newScrollLeft));
			} else {
				// Horizontal scroll
				const delta = e.deltaY || e.deltaX;
				setScrollLeft((prev) => Math.max(0, prev + delta));
			}
		};

		element.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			element.removeEventListener("wheel", handleWheel);
		};
	}, [zoom, scrollLeft]);

	const handleTimelineClick = (e) => {
		if (!trackRef.current) return;
		const rect = trackRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;

		// Calculate time based on scroll and zoom
		const clickTime = (scrollLeft + x) / zoom;

		onSeek(Math.max(0, clickTime));
	};

	const handleMouseMove = (e) => {
		if (e.buttons === 1) {
			// Dragging
			handleTimelineClick(e);
		}
	};

	// Auto-scroll during playback
	useEffect(() => {
		if (!isPlaying || !scrollContainerRef.current) return;
		const playheadPos = currentTime * zoom;
		const width = scrollContainerRef.current.clientWidth;

		if (playheadPos > scrollLeft + width) {
			setScrollLeft(playheadPos - width * 0.2);
		}
	}, [currentTime, isPlaying, zoom, scrollLeft]);

	return (
		<div
			className={`flex flex-col bg-[#09090b] border-t border-zinc-800/50 select-none transition-all duration-300 ease-in-out shrink-0 z-10 shadow-2xl ${
				isCollapsed ? "h-12" : "h-80"
			}`}
		>
			{/* Controls Bar */}
			<div className="h-12 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0 z-20 relative">
				{/* Left: Playback Controls */}
				<div className="flex items-center gap-2">
					<button
						onClick={() => onSceneChange(Math.max(0, currentScene - 1))}
						className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-95"
						title="Previous Scene"
					>
						<SkipBack size={16} />
					</button>
					<button
						onClick={onPlayPause}
						className="p-2 bg-zinc-100 hover:bg-white text-black rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5"
						title={isPlaying ? "Pause" : "Play"}
					>
						{isPlaying ? (
							<Pause size={16} fill="currentColor" />
						) : (
							<Play size={16} fill="currentColor" />
						)}
					</button>
					<button
						onClick={onStop}
						className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-95"
						title="Stop"
					>
						<Square size={14} fill="currentColor" />
					</button>
					<button
						onClick={() =>
							onSceneChange(Math.min(scenes.length - 1, currentScene + 1))
						}
						className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-95"
						title="Next Scene"
					>
						<SkipForward size={16} />
					</button>
				</div>

				{/* Center: Time Display */}
				<div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 font-mono text-xs tracking-wider bg-zinc-900/50 px-4 py-1.5 rounded-full border border-zinc-800/50">
					<span className="text-blue-400 font-bold text-sm">
						{formatTime(currentTime)}
					</span>
					<span className="text-zinc-600">/</span>
					<span className="text-zinc-500">{formatTime(totalDuration)}</span>
				</div>

				{/* Right: Window Controls */}
				<div className="flex items-center gap-2">
					<span className="text-xs text-zinc-500 font-mono">
						{zoom.toFixed(0)}px/s
					</span>
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all"
						title={isCollapsed ? "Expand Timeline" : "Minimize Timeline"}
					>
						{isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>
				</div>
			</div>

			{/* Timeline Area */}
			<div
				ref={scrollContainerRef}
				className={`flex-1 relative overflow-hidden flex flex-col bg-[#0c0c0e] ${
					isCollapsed ? "hidden" : "flex"
				}`}
			>
				{/* Ruler */}
				<div className="h-8 shrink-0 border-b border-zinc-800/30 bg-[#09090b] z-10 relative">
					<Ruler
						totalDuration={totalDuration}
						zoom={zoom}
						scrollLeft={scrollLeft}
					/>
				</div>

				{/* Tracks Container */}
				<div
					ref={trackRef}
					onMouseDown={handleTimelineClick}
					onMouseMove={handleMouseMove}
					className="flex-1 relative cursor-pointer"
					style={{
						width: "100%",
						height: "100%",
						backgroundImage:
							"linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
						backgroundSize: "100% 40px",
					}}
				>
					{/* Scene Track */}
					<div
						className="absolute top-4 h-12"
						style={{ transform: `translateX(${-scrollLeft}px)` }}
					>
						{scenes.map((scene, i) => {
							// Calculate accurate start time by summing all previous scene durations
							const startSeconds = scenes
								.slice(0, i)
								.reduce((acc, s) => acc + (s.duration || 0), 0);

							// Use the scene's actual duration
							const durationSeconds = scene.duration || 0;

							// Convert to pixels using current zoom
							const startPx = startSeconds * zoom;
							const widthPx = durationSeconds * zoom;

							const isActive = i === currentScene;

							// Debug log for first render
							if (i === 0) {
								console.log(`🎬 Scene ${i} rendering:`, {
									startSeconds,
									durationSeconds,
									startPx,
									widthPx,
									zoom,
								});
							}

							return (
								<div
									key={i}
									className={`absolute top-0 bottom-0 rounded-lg overflow-hidden transition-all duration-300 group border ${
										isActive
											? "bg-zinc-800/80 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
											: "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40"
									}`}
									style={{
										left: `${startPx}px`,
										width: `${Math.max(widthPx - 2, 20)}px`, // Minimum 20px width
									}}
									title={`${scene.name} - ${durationSeconds.toFixed(2)}s`}
								>
									<div
										className={`px-3 py-2.5 text-xs font-medium truncate capitalize transition-colors flex items-center gap-2 ${
											isActive
												? "text-blue-100"
												: "text-zinc-500 group-hover:text-zinc-400"
										}`}
									>
										<span
											className={`w-1.5 h-1.5 rounded-full ${
												isActive ? "bg-blue-500" : "bg-zinc-700"
											}`}
										/>
										{scene.name || `Scene ${i + 1}`}
										<span className="text-[10px] opacity-50 ml-auto">
											{durationSeconds.toFixed(1)}s
										</span>
									</div>
								</div>
							);
						})}

						{/* Infinite Line */}
						<div
							className="absolute top-1/2 -translate-y-1/2 h-px bg-zinc-800/50"
							style={{ left: totalDuration * zoom, width: "10000px" }}
						></div>
					</div>

					{/* Playhead */}
					<div
						className="absolute top-0 bottom-0 w-px bg-blue-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.8)]"
						style={{ left: `${currentTime * zoom - scrollLeft}px` }}
					>
						{/* Playhead Handle */}
						<div className="absolute -top-3 left-1/2 -translate-x-1/2">
							<div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-500 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
