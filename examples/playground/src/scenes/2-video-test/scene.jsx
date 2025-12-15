import { all, waitFor } from "@motion-dom/core";

export const View = () => (
	<div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
		<div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
			<h1
				id="title"
				className="text-8xl font-black text-white opacity-0 translate-y-20 blur-[10px]"
			>
				Motion DOM
			</h1>
			<p
				id="subtitle"
				className="mt-6 text-3xl text-zinc-300 opacity-0 translate-y-10"
			>
				High performance animation
			</p>
		</div>
	</div>
);

export function* flow() {
	// Fade in title
	yield* title("opacity-100 translate-y-0 blur-[0px]", 1.5);

	// Fade in subtitle
	yield* subtitle("opacity-100 translate-y-0", 0.8);

	// Wait
	yield* waitFor(2);

	// Fade out
	yield* all(
		title("opacity-0 translate-y-[-20px]", 0.8),
		subtitle("opacity-0 translate-y-[-20px]", 0.8)
	);
}
