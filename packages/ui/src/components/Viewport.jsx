import React, { useRef, useEffect, useState } from "react";

export function Viewport({ children }) {
	const containerRef = useRef(null);
	const [scale, setScale] = useState(1);
	const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

	useEffect(() => {
		const updateScale = () => {
			if (!containerRef.current) return;
			const { width, height } = containerRef.current.getBoundingClientRect();

			// Make canvas responsive to fill the available space
			const availableW = width;
			const availableH = height;

			setCanvasSize({ width: availableW, height: availableH });
			setScale(1);
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		const observer = new ResizeObserver(updateScale);
		if (containerRef.current) observer.observe(containerRef.current);

		return () => {
			window.removeEventListener("resize", updateScale);
			observer.disconnect();
		};
	}, []);

	return (
		<div className="mdc-viewport">
			{/* Canvas Area - This fills all available space */}
			<div ref={containerRef} className="mdc-viewport-canvas-area">
				{/* Subtle grid pattern */}
				<div className="mdc-viewport-grid"></div>

				{/* The Stage - This is your actual scene canvas */}
				<div
					className="mdc-viewport-stage"
					style={{
						width: canvasSize.width,
						height: canvasSize.height,
						transform: `scale(${scale})`,
						transformOrigin: "center center",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
