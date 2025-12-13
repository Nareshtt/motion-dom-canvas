import { all, waitFor } from "@motion-dom/core";

export const View = () => (
	<div
		id="view"
		className="relative w-full h-full bg-[#050505] flex flex-col justify-center items-center overflow-hidden font-sans text-white"
	>
		{/* Background Gradient */}
		<div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#000000] opacity-80"></div>

		{/* Decorative Elements */}
		<div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
		<div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>

		{/* Content Container */}
		<div className="z-10 flex flex-col items-center">
			{/* Title */}
			<h1
				id="title"
				className="text-9xl font-black tracking-tighter opacity-0 translate-y-10 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400"
			>
				MotionDOM
			</h1>

			{/* Subtitle */}
			<p
				id="subtitle"
				className="mt-6 text-2xl text-zinc-400 font-light tracking-widest uppercase opacity-0 translate-y-4"
			>
				The Future of Web Animation
			</p>

			{/* Decorative Line */}
			<div
				id="line"
				className="mt-8 w-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"
			></div>
		</div>
	</div>
);

export function* flow() {
	// Reveal Title
	yield* title("opacity-100 translate-y-0", 1.5);

	// Reveal Subtitle and Line together
	yield* all(
		subtitle("opacity-100 translate-y-0", 1),
		line("w-96 opacity-50", 1.2)
	);

	// Hold for a moment
	yield* waitFor(1);

	// Fade out everything
	yield* all(
		title("opacity-0", 1),
		subtitle("opacity-0", 1),
		line("opacity-0", 1)
	);
}
