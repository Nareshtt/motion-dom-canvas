import { waitFor, fade, chain } from "@motion-dom/core";
import { Code, Zap } from "lucide-react";

export const View = () => (
	<div
		id="view"
		className="relative w-full h-full bg-[#050505] flex flex-col justify-center items-center overflow-hidden font-sans text-white"
	>
		{/* Background Gradient (Deep Space) */}
		<div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#000000] to-[#0a0a0a]"></div>

		{/* Decorative Glows (Cyan/Blue for Tech feel) */}
		<div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]"></div>
		<div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]"></div>

		{/* Grid Overlay (Subtle Tech Grid) */}
		<div
			className="absolute inset-0 opacity-[0.05]"
			style={{
				backgroundImage:
					"linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
				backgroundSize: "50px 50px",
			}}
		></div>

		<div className="z-10 flex gap-16 items-center">
			{/* Feature Panel 1 (Holographic HUD) */}
			<div
				id="panel1"
				className="relative w-80 h-96 border border-cyan-500/30 bg-cyan-950/10 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center justify-center gap-6 opacity-0 shadow-[0_0_30px_rgba(8,145,178,0.1)] scale-90"
			>
				{/* Corner Accents */}
				<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
				<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
				<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
				<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

				<div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
					<Code size={40} />
				</div>
				<div className="text-center">
					<h3 className="text-2xl font-bold mb-2 tracking-wider text-cyan-100 uppercase">
						Code First
					</h3>
					<div className="h-px w-12 bg-cyan-500/50 mx-auto mb-4"></div>
					<p className="text-cyan-200/70 text-sm leading-relaxed font-mono">
						// GENERATOR_BASED
						<br />
						// REACT_COMPONENTS
						<br />
						// FULL_CONTROL
					</p>
				</div>
			</div>

			{/* Feature Panel 2 (Holographic HUD) */}
			<div
				id="panel2"
				className="relative w-80 h-96 border border-blue-500/30 bg-blue-950/10 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center justify-center gap-6 opacity-0 shadow-[0_0_30px_rgba(59,130,246,0.1)] scale-90"
			>
				{/* Corner Accents */}
				<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
				<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
				<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
				<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>

				<div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
					<Zap size={40} />
				</div>
				<div className="text-center">
					<h3 className="text-2xl font-bold mb-2 tracking-wider text-blue-100 uppercase">
						Performance
					</h3>
					<div className="h-px w-12 bg-blue-500/50 mx-auto mb-4"></div>
					<p className="text-blue-200/70 text-sm leading-relaxed font-mono">
						// 60_FPS_LOCKED
						<br />
						// GPU_ACCELERATED
						<br />
						// OPTIMIZED_RENDER
					</p>
				</div>
			</div>
		</div>
	</div>
);

export function* flow() {
	// Transition
	yield* fade(1);

	// Reveal Panel 1 (Tech Scale In)
	// Using global helper: panel1(classes, duration)
	yield* panel1("opacity-100 scale-100 blur-0", 0.8);

	yield* waitFor(0.2);

	// Reveal Panel 2 (Tech Scale In)
	yield* panel2("opacity-100 scale-100 blur-0", 0.8);

	yield* waitFor(2);
}
