import { waitFor, all, delay } from "@motion-dom/core";

// 1. THE VIEW (Your HTML/Tailwind)
export const View = () => (
	<div
		id="background"
		className="relative w-full h-screen bg-red-500 flex flex-col justify-center items-center overflow-hidden brightness-100"
	>
		{/* DECORATIVE BLOBS */}
		<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
		<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

		{/* LOGO BOX */}
		<div
			id="logoBox"
			className="z-10 bg-gradient-to-r from-blue-500 to-purple-600 w-24 h-24 rounded-full shadow-2xl scale-0 rotate-180 flex items-center justify-center overflow-hidden"
		>
			<div className="w-4 h-4 bg-white rounded-full"></div>
		</div>

		{/* TEXT */}
		<div className="z-20 text-center mt-8 absolute top-[55%]">
			<h1
				id="mainText"
				className="text-6xl font-black text-white uppercase tracking-tighter opacity-0"
				style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
			>
				MotionDOM
			</h1>
			<p
				id="subText"
				className="text-blue-200 mt-4 text-xl font-light tracking-wide opacity-0 translate-y-10"
			>
				Productivity + Control
			</p>
		</div>
	</div>
);

// 2. THE ANIMATION (Your Logic)
// We export this as a named export 'flow' (or any name you prefer)
export function* flow() {
	yield* waitFor(0.5);

	yield* all(
		logoBox("scale-100", 0.8),
		logoBox("rotate-0", 0.8),
		delay(0.2, logoBox("w-96", 0.8)),
		delay(0.2, logoBox("rounded-2xl", 0.6))
	);

	yield* all(
		mainText("opacity-100 text-yellow-500", 1),
		mainText("tracking-widest", 1.2),
		delay(0.4, subText("opacity-100", 1)),
		delay(0.4, subText("translate-y-0", 1)),
		logoBox("from-white to-white", 1)
	);

	yield* waitFor(1);
}
