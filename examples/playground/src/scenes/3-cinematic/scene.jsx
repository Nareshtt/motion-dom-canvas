import { all, chain, waitFor, zoom } from "@motion-dom/core";
import { Film, Camera, Clapperboard } from "lucide-react";

export const View = () => (
	<div
		id="view"
		className="relative w-full h-full bg-black flex flex-col justify-center items-center overflow-hidden font-sans text-white"
	>
		{/* Camera Container (Simulates Camera Movement) */}
		<div
			id="camera"
			className="relative w-full h-full flex items-center justify-center origin-center"
		>
			{/* Background Layers */}
			<div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-slate-900"></div>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-50"></div>

			{/* Floating Elements */}
			<div
				id="icon1"
				className="absolute top-1/4 left-1/4 opacity-0 translate-y-10 scale-50"
			>
				<Film size={64} className="text-indigo-500" />
			</div>
			<div
				id="icon2"
				className="absolute bottom-1/4 right-1/4 opacity-0 translate-y-10 scale-50"
			>
				<Camera size={64} className="text-purple-500" />
			</div>
			<div
				id="icon3"
				className="absolute top-1/3 right-1/3 opacity-0 translate-y-10 scale-50"
			>
				<Clapperboard size={48} className="text-pink-500" />
			</div>

			{/* Main Title Sequence */}
			<div className="z-10 flex flex-col items-center">
				<h1
					id="mainTitle"
					className="text-8xl font-black tracking-tighter opacity-0 scale-150 bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-indigo-200"
				>
					CINEMATIC
				</h1>
				<div
					id="separator"
					className="w-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mt-4 opacity-0"
				></div>
				<p
					id="subText"
					className="mt-4 text-xl text-indigo-300/80 font-light tracking-[1em] uppercase opacity-0 translate-y-4"
				>
					Experience
				</p>
			</div>
		</div>

		{/* Vignette Overlay */}
		<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] pointer-events-none"></div>
	</div>
);

export function* flow() {
	// Transition
	yield* zoom(1);

	// 1. Opening: Camera Zoom In + Icons appearing
	yield* all(
		camera("scale-110", 2), // Slow zoom in
		chain(
			icon1("opacity-50 translate-y-0 scale-100", 0.5),
			icon2("opacity-50 translate-y-0 scale-100", 0.5),
			icon3("opacity-50 translate-y-0 scale-100", 0.5)
		)
	);

	// 2. Title Reveal (Explosive)
	yield* all(
		mainTitle("opacity-100 scale-100 blur-0", 0.8),
		separator("w-64 opacity-100", 1),
		camera("scale-100", 0.2) // Camera shake/impact
	);

	// 3. Subtext + Camera Drift
	yield* all(
		subText("opacity-100 translate-y-0", 1.5),
		camera("scale-105 rotate-1", 3) // Slow drift
	);

	// 4. Fade Out
	yield* all(
		mainTitle("opacity-0 blur-lg scale-150", 1),
		subText("opacity-0 tracking-[2em]", 1),
		separator("w-0 opacity-0", 1),
		icon1("opacity-0 scale-0", 0.5),
		icon2("opacity-0 scale-0", 0.5),
		icon3("opacity-0 scale-0", 0.5),
		camera("scale-100 rotate-0", 1)
	);

	yield* waitFor(0.5);
}
