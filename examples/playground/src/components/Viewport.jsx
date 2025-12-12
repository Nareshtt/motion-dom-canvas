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
		<div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden relative">
			{/* Canvas Area - This fills all available space */}
			<div
				ref={containerRef}
				className="flex-1 flex items-center justify-center relative overflow-hidden"
				style={{
					background: "#0a0a0a",
				}}
			>
				{/* Subtle grid pattern */}
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage: `
							linear-gradient(to right, #333 1px, transparent 1px),
							linear-gradient(to bottom, #333 1px, transparent 1px)
						`,
						backgroundSize: "40px 40px",
					}}
				></div>

				{/* The Stage - This is your actual scene canvas */}
				<div
					className="relative overflow-hidden"
					style={{
						width: canvasSize.width,
						height: canvasSize.height,
						transform: `scale(${scale})`,
						transformOrigin: "center center",
						boxShadow:
							"0 0 0 1px rgba(255,255,255,0.1), 0 20px 80px rgba(0,0,0,0.5)",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
