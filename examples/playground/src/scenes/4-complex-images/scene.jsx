import { all, chain, waitFor, slide, zoom } from "@motion-dom/core";
import imgUrl from "./assets/test_image.png";
import { Sparkles, Zap, Layers } from "lucide-react";

// -------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------
export const View = () => (
	<div
		id="view"
		className="relative w-full h-full bg-black flex flex-col justify-center items-center overflow-hidden font-sans text-white perspective-1000"
	>
		{/* Camera Container */}
		<div
			id="camera"
			className="relative w-full h-full flex items-center justify-center origin-center"
		>
			{/* Background Layers */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900"></div>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50"></div>
			<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

			{/* Decorative Elements */}
			<div
				id="decoCircle"
				className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full border border-white/10 opacity-0 scale-50"
			></div>
			<div
				id="decoLine"
				className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 scale-x-0"
			></div>

			{/* Main Content Container */}
			<div className="z-10 flex flex-row items-center gap-16">
				{/* Text Section */}
				<div className="flex flex-col items-start">
					<div
						id="badge"
						className="flex items-center gap-2 mb-4 opacity-0 -translate-x-10"
					>
						<Sparkles size={16} className="text-indigo-400" />
						<span className="text-xs font-bold tracking-widest uppercase text-indigo-400">
							Next Gen
						</span>
					</div>
					<h1
						id="complexTitle"
						className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 opacity-0 translate-y-10"
					>
						COMPLEX
						<br />
						<span className="text-4xl font-light tracking-widest text-white/80">
							LAYERS
						</span>
					</h1>
					<p
						id="complexDesc"
						className="mt-6 max-w-md text-lg text-slate-400 font-light leading-relaxed opacity-0 translate-y-4"
					>
						Experience depth and dimension with advanced composition techniques.
					</p>
				</div>

				{/* Image Card Section */}
				<div
					id="cardContainer"
					className="relative group perspective-1000 opacity-0 translate-x-20 rotate-12"
				>
					<div
						id="cardGlow"
						className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-25 transition duration-1000 group-hover:opacity-75"
					></div>
					<div
						id="complexImg"
						className="relative w-80 h-96 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-white/10"
					>
						<div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10"></div>
						<img
							src={imgUrl}
							className="w-full h-full object-cover"
							alt="Cinematic Asset"
						/>
						{/* Card Overlay UI */}
						<div className="absolute bottom-0 left-0 p-6 z-20 w-full">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Layers size={20} className="text-white" />
									<span className="text-sm font-medium text-white">
										Layer 01
									</span>
								</div>
								<Zap size={20} className="text-yellow-400" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		{/* Vignette & Grain Overlay */}
		<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_120%)] pointer-events-none"></div>
	</div>
);

// -------------------------------------------------------------------------
// Flow
// -------------------------------------------------------------------------
export function* flow() {
	// Transition
	yield* zoom(1.2);

	// 1. Intro Sequence
	yield* all(
		camera("scale-110", 2), // Slow zoom in
		decoCircle("opacity-20 scale-100", 1.5),
		decoLine("opacity-50 scale-x-100", 1.5),
		chain(
			badge("opacity-100 translate-x-0", 0.5),
			complexTitle("opacity-100 translate-y-0", 0.8),
			complexDesc("opacity-100 translate-y-0", 0.8)
		),
		chain(waitFor(0.2), cardContainer("opacity-100 translate-x-0 rotate-0", 1))
	);

	yield* waitFor(0.5);

	// 2. Showcase (Float & Highlight)
	yield* all(
		camera("scale-100 rotate-1", 2), // Camera drift
		cardContainer("translate-y-[-20px] rotate-[-2]", 2), // Float up
		cardGlow("opacity-75", 1.5)
	);

	yield* waitFor(0.5);

	// 3. Exit Sequence
	yield* all(
		camera("scale-105", 1),
		complexTitle("opacity-0 translate-y-[-20px]", 0.5),
		complexDesc("opacity-0 translate-y-[-20px]", 0.5),
		badge("opacity-0", 0.5),
		cardContainer("opacity-0 scale-110 rotate-12", 0.8),
		decoCircle("opacity-0 scale-150", 0.8),
		decoLine("opacity-0 scale-x-0", 0.8)
	);

	yield* waitFor(0.5);
}
