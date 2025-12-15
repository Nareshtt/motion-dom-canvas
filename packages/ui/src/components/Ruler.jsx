import React, { useRef, useEffect } from "react";

export function Ruler({ totalDuration, zoom, scrollLeft }) {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, rect.width, rect.height);

		// Styling
		ctx.font = "500 10px 'JetBrains Mono', monospace"; // Monospace for tech feel
		ctx.textBaseline = "top";

		const majorTickColor = "#52525b"; // Zinc 600
		const minorTickColor = "#27272a"; // Zinc 800
		const textColor = "#71717a"; // Zinc 500

		// Calculate visible range
		const startSeconds = scrollLeft / zoom;
		const endSeconds = (scrollLeft + rect.width) / zoom;

		// Determine step size based on zoom
		let majorStep = 1; // seconds
		let minorStep = 0.1; // seconds

		if (zoom < 20) {
			majorStep = 10;
			minorStep = 1;
		} else if (zoom < 50) {
			majorStep = 5;
			minorStep = 0.5;
		} else if (zoom > 200) {
			majorStep = 0.5;
			minorStep = 0.05;
		}

		// Align start to grid
		const startTick = Math.floor(startSeconds / minorStep) * minorStep;

		for (let t = startTick; t <= endSeconds; t += minorStep) {
			// Avoid floating point errors
			const time = Math.round(t * 100) / 100;
			const x = time * zoom - scrollLeft;

			if (x < -10 || x > rect.width + 10) continue;

			const isMajor = Math.abs(time % majorStep) < 0.001;

			ctx.beginPath();
			if (isMajor) {
				ctx.strokeStyle = majorTickColor;
				ctx.lineWidth = 1;
				ctx.moveTo(x, 20); // Bottom aligned ticks
				ctx.lineTo(x, 32);

				// Draw label
				ctx.fillStyle = textColor;
				const label = formatTime(time);
				// Center text on tick
				const textWidth = ctx.measureText(label).width;
				ctx.fillText(label, x - textWidth / 2, 6);
			} else {
				ctx.strokeStyle = minorTickColor;
				ctx.lineWidth = 1;
				ctx.moveTo(x, 26);
				ctx.lineTo(x, 32);
			}
			ctx.stroke();
		}
	}, [totalDuration, zoom, scrollLeft]);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return <canvas ref={canvasRef} className="mdc-ruler-canvas" />;
}
