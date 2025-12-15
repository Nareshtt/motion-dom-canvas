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
	audio,
	volume = 1,
	onVolumeChange,
}) {
	const trackRef = useRef(null);
	const scrollContainerRef = useRef(null);
	const isDraggingRef = useRef(false);
	const lastSeekTimeRef = useRef(0);

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

	const calculateTimeFromMouseX = (clientX) => {
		if (!trackRef.current) return 0;
		const rect = trackRef.current.getBoundingClientRect();
		const x = clientX - rect.left;
		const clickTime = (scrollLeft + x) / zoom;
		return Math.max(0, Math.min(clickTime, totalDuration));
	};

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (!isDraggingRef.current) return;
			const time = calculateTimeFromMouseX(e.clientX);
			onSeek(time);
		};

		const handleMouseUp = () => {
			if (isDraggingRef.current) {
				isDraggingRef.current = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			}
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [zoom, scrollLeft, totalDuration, onSeek]);

	const handleMouseDown = (e) => {
		// Only handle left mouse button
		if (e.button !== 0) return;

		// Check if clicking on a scene block
		if (e.target.closest(".mdc-scene-block")) return;

		isDraggingRef.current = true;
		document.body.style.cursor = "grabbing";
		document.body.style.userSelect = "none";

		const time = calculateTimeFromMouseX(e.clientX);
		onSeek(time);
	};

	// Auto-scroll during playback
	useEffect(() => {
		if (!isPlaying || !scrollContainerRef.current) return;
		const playheadPos = currentTime * zoom;
		const width = scrollContainerRef.current.clientWidth;

		if (playheadPos > scrollLeft + width * 0.8) {
			setScrollLeft(playheadPos - width * 0.2);
		} else if (playheadPos < scrollLeft + width * 0.2) {
			setScrollLeft(Math.max(0, playheadPos - width * 0.2));
		}
	}, [currentTime, isPlaying, zoom, scrollLeft]);

	return (
		<div className={`mdc-timeline ${isCollapsed ? "collapsed" : "expanded"}`}>
			{/* Controls Bar */}
			<div className="mdc-timeline-controls">
				{/* Left: Playback Controls */}
				<div className="mdc-playback-controls">
					<button
						onClick={() => {
							const prevScene = Math.max(0, currentScene - 1);
							onSceneChange(prevScene);
						}}
						className="mdc-btn mdc-btn-ghost"
						title="Previous Scene"
					>
						<SkipBack size={16} />
					</button>
					<button
						onClick={onPlayPause}
						className="mdc-btn mdc-btn-primary"
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
						className="mdc-btn mdc-btn-ghost"
						title="Stop"
					>
						<Square size={14} fill="currentColor" />
					</button>
					<button
						onClick={() => {
							const nextScene = Math.min(scenes.length - 1, currentScene + 1);
							onSceneChange(nextScene);
						}}
						className="mdc-btn mdc-btn-ghost"
						title="Next Scene"
					>
						<SkipForward size={16} />
					</button>

					{/* Volume Control */}
					{audio && onVolumeChange && (
						<div className="mdc-volume-control">
							<span className="mdc-volume-label">VOL</span>
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								value={volume}
								onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
								className="mdc-volume-slider"
							/>
						</div>
					)}
				</div>

				{/* Center: Time Display */}
				<div className="mdc-time-display">
					<span className="mdc-time-current">{formatTime(currentTime)}</span>
					<span className="mdc-time-separator">/</span>
					<span className="mdc-time-total">{formatTime(totalDuration)}</span>
				</div>

				{/* Right: Window Controls */}
				<div className="mdc-window-controls">
					<span className="mdc-zoom-display">{zoom.toFixed(0)}px/s</span>
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="mdc-btn mdc-btn-ghost"
						title={isCollapsed ? "Expand Timeline" : "Minimize Timeline"}
					>
						{isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>
				</div>
			</div>

			{/* Timeline Area */}
			<div
				ref={scrollContainerRef}
				className={`mdc-timeline-area ${isCollapsed ? "hidden" : ""}`}
			>
				{/* Ruler */}
				<div className="mdc-ruler">
					<Ruler
						totalDuration={totalDuration}
						zoom={zoom}
						scrollLeft={scrollLeft}
					/>
				</div>

				{/* Tracks Area */}
				<div className="mdc-tracks-wrapper">
					{/* Tracks Container */}
					<div
						ref={trackRef}
						onMouseDown={handleMouseDown}
						className="mdc-tracks-container"
					>
						<div
							className="mdc-tracks-content"
							style={{
								transform: `translateX(${-scrollLeft}px)`,
								width: `${totalDuration * zoom}px`,
							}}
						>
							{/* Scenes Track */}
							<div className="mdc-scene-track">
								{scenes.map((scene, i) => {
									const startSeconds = scenes
										.slice(0, i)
										.reduce((acc, s) => acc + (s.duration || 0), 0);
									const durationSeconds = scene.duration || 0;
									const startPx = startSeconds * zoom;
									const widthPx = durationSeconds * zoom;
									const isActive = i === currentScene;

									return (
										<div
											key={i}
											className={`mdc-scene-block ${
												isActive ? "active" : "inactive"
											}`}
											style={{
												left: `${startPx}px`,
												width: `${Math.max(widthPx - 2, 20)}px`,
											}}
											onMouseDown={(e) => {
												e.stopPropagation();
												const newTime = scenes
													.slice(0, i)
													.reduce((acc, s) => acc + (s.duration || 0), 0);
												onSeek(newTime);
											}}
											title={`${scene.name} - ${durationSeconds.toFixed(2)}s`}
										>
											<div className="mdc-scene-block-content">
												<span className="mdc-scene-indicator" />
												{scene.name}
												<span className="mdc-scene-duration">
													{durationSeconds.toFixed(1)}s
												</span>
											</div>
										</div>
									);
								})}
							</div>

							{/* Audio Track */}
							{audio && (
								<div className="mdc-audio-track">
									<div
										className="mdc-audio-block"
										style={{
											left: 0,
											width: `${totalDuration * zoom}px`,
										}}
									>
										<div className="mdc-audio-block-content">
											<span className="mdc-audio-indicator" />
											Audio Track
											<span className="mdc-scene-duration">
												{totalDuration.toFixed(1)}s
											</span>
										</div>
										{/* Waveform visual placeholder */}
										<div className="mdc-audio-waveform"></div>
									</div>
								</div>
							)}

							{/* Infinite Line */}
							<div
								className="mdc-infinite-line"
								style={{ left: totalDuration * zoom }}
							></div>
						</div>

						{/* Playhead */}
						<div
							className="mdc-playhead"
							style={{ left: `${currentTime * zoom - scrollLeft}px` }}
						>
							{/* Playhead Handle */}
							<div className="mdc-playhead-handle">
								<div className="mdc-playhead-triangle"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
