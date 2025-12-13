import { all, waitFor } from "@motion-dom/core";
import { BarChart3 } from "lucide-react";

export const View = () => {
	return (
		<div className="w-full h-full bg-slate-950 text-white p-12 flex flex-col gap-8 font-sans">
			{/* Header */}
			<div
				id="header"
				className="flex items-center gap-4 opacity-0 translate-y-4"
			>
				<div className="p-3 bg-indigo-600 rounded-xl">
					<BarChart3 className="w-8 h-8 text-white" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Bubble Sort</h1>
					<p className="text-slate-400">Visualizing algorithms</p>
				</div>
			</div>

			{/* Main Content Split */}
			<div className="flex-1 flex gap-8 min-h-0">
				{/* Left: Code Editor */}
				<div
					id="editorPanel"
					className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden opacity-0 -translate-x-8 shadow-2xl"
				>
					{/* Editor Tab Bar */}
					<div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
						<div className="flex gap-1.5">
							<div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
							<div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
							<div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
						</div>
						<div className="ml-4 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
							sort.js
						</div>
					</div>

					{/* Editor Content */}
					<div className="p-6 font-mono text-sm leading-relaxed relative flex-1">
						<div className="absolute left-4 top-6 text-slate-700 select-none text-right w-6">
							1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />
							10
						</div>
						<div
							id="codeContent"
							className="pl-10 text-blue-300 whitespace-pre-wrap"
						>
							// Ready to sort...
						</div>
					</div>
				</div>

				{/* Right: Visualizer */}
				<div
					id="visualizerPanel"
					className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur opacity-0 translate-x-8 flex flex-col p-8 items-center justify-center relative"
				>
					<div
						id="statusText"
						className="absolute top-8 text-slate-400 font-mono text-sm"
					>
						Waiting...
					</div>

					{/* Bars Container */}
					<div className="relative w-[300px] h-[200px] border-b-2 border-slate-700">
						{/* Bar 0 - Value 5, Height 100px */}
						<div
							id="bar0"
							className="absolute bottom-0 translate-x-0 w-[40px] h-[100px] bg-blue-500 rounded-t-md flex items-end justify-center pb-2 text-xs font-bold"
						>
							5
						</div>
						{/* Bar 1 - Value 3, Height 60px */}
						<div
							id="bar1"
							className="absolute bottom-0 translate-x-[60px] w-[40px] h-[60px] bg-blue-500 rounded-t-md flex items-end justify-center pb-2 text-xs font-bold"
						>
							3
						</div>
						{/* Bar 2 - Value 8, Height 160px */}
						<div
							id="bar2"
							className="absolute bottom-0 translate-x-[120px] w-[40px] h-[160px] bg-blue-500 rounded-t-md flex items-end justify-center pb-2 text-xs font-bold"
						>
							8
						</div>
						{/* Bar 3 - Value 2, Height 40px */}
						<div
							id="bar3"
							className="absolute bottom-0 translate-x-[180px] w-[40px] h-[40px] bg-blue-500 rounded-t-md flex items-end justify-center pb-2 text-xs font-bold"
						>
							2
						</div>
						{/* Bar 4 - Value 6, Height 120px */}
						<div
							id="bar4"
							className="absolute bottom-0 translate-x-[240px] w-[40px] h-[120px] bg-blue-500 rounded-t-md flex items-end justify-center pb-2 text-xs font-bold"
						>
							6
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export function* flow() {
	// 1. Setup Scene
	yield* all(
		header("opacity-100 translate-y-0", 1),
		editorPanel("opacity-100 translate-x-0", 1),
		visualizerPanel("opacity-100 translate-x-0", 1)
	);
	yield* waitFor(0.5);

	// 2. Write Code
	const code = `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        swap(arr, j, j + 1);
      }
    }
  }
}`;
	yield* codeContent.text(code, 2);
	yield* waitFor(1);

	// 3. Execute Sort
	yield* statusText.text("Starting Bubble Sort...", 0.5);
	yield* waitFor(0.5);

	// Array: [5, 3, 8, 2, 6] - Values
	// Positions: [0, 60, 120, 180, 240] - translate-x values

	// Pass 1
	yield* statusText.text("Comparing 5 and 3", 0.2);
	yield* all(bar0("bg-yellow-500", 0.3), bar1("bg-yellow-500", 0.3));
	yield* waitFor(0.4);

	yield* statusText.text("Swapping 5 and 3", 0.2);
	yield* all(bar0("bg-red-500", 0.3), bar1("bg-red-500", 0.3));
	yield* waitFor(0.2);
	yield* all(bar0("translate-x-[60px]", 0.6), bar1("translate-x-0", 0.6));
	yield* waitFor(0.3);
	yield* all(bar0("bg-blue-500", 0.3), bar1("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Now order is: [3, 5, 8, 2, 6]
	yield* statusText.text("Comparing 5 and 8", 0.2);
	yield* all(bar0("bg-yellow-500", 0.3), bar2("bg-yellow-500", 0.3));
	yield* waitFor(0.4);
	yield* all(bar0("bg-blue-500", 0.3), bar2("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	yield* statusText.text("Comparing 8 and 2", 0.2);
	yield* all(bar2("bg-yellow-500", 0.3), bar3("bg-yellow-500", 0.3));
	yield* waitFor(0.4);

	yield* statusText.text("Swapping 8 and 2", 0.2);
	yield* all(bar2("bg-red-500", 0.3), bar3("bg-red-500", 0.3));
	yield* waitFor(0.2);
	yield* all(
		bar2("translate-x-[180px]", 0.6),
		bar3("translate-x-[120px]", 0.6)
	);
	yield* waitFor(0.3);
	yield* all(bar2("bg-blue-500", 0.3), bar3("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Now order is: [3, 5, 2, 8, 6]
	yield* statusText.text("Comparing 8 and 6", 0.2);
	yield* all(bar2("bg-yellow-500", 0.3), bar4("bg-yellow-500", 0.3));
	yield* waitFor(0.4);

	yield* statusText.text("Swapping 8 and 6", 0.2);
	yield* all(bar2("bg-red-500", 0.3), bar4("bg-red-500", 0.3));
	yield* waitFor(0.2);
	yield* all(
		bar2("translate-x-[240px]", 0.6),
		bar4("translate-x-[180px]", 0.6)
	);
	yield* waitFor(0.3);
	yield* all(bar2("bg-blue-500", 0.3), bar4("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Mark 8 as sorted (now at position 4)
	yield* bar2("bg-green-500", 0.5);
	yield* waitFor(0.2);

	// Pass 2 - Now order is: [3, 5, 2, 6, 8*]
	yield* statusText.text("Comparing 3 and 5", 0.2);
	yield* all(bar1("bg-yellow-500", 0.3), bar0("bg-yellow-500", 0.3));
	yield* waitFor(0.4);
	yield* all(bar1("bg-blue-500", 0.3), bar0("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	yield* statusText.text("Comparing 5 and 2", 0.2);
	yield* all(bar0("bg-yellow-500", 0.3), bar3("bg-yellow-500", 0.3));
	yield* waitFor(0.4);

	yield* statusText.text("Swapping 5 and 2", 0.2);
	yield* all(bar0("bg-red-500", 0.3), bar3("bg-red-500", 0.3));
	yield* waitFor(0.2);
	yield* all(bar0("translate-x-[120px]", 0.6), bar3("translate-x-[60px]", 0.6));
	yield* waitFor(0.3);
	yield* all(bar0("bg-blue-500", 0.3), bar3("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Now order is: [3, 2, 5, 6, 8*]
	yield* statusText.text("Comparing 5 and 6", 0.2);
	yield* all(bar0("bg-yellow-500", 0.3), bar4("bg-yellow-500", 0.3));
	yield* waitFor(0.4);
	yield* all(bar0("bg-blue-500", 0.3), bar4("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Mark 6 as sorted (at position 3)
	yield* bar4("bg-green-500", 0.5);
	yield* waitFor(0.2);

	// Pass 3 - Now order is: [3, 2, 5, 6*, 8*]
	yield* statusText.text("Comparing 3 and 2", 0.2);
	yield* all(bar1("bg-yellow-500", 0.3), bar3("bg-yellow-500", 0.3));
	yield* waitFor(0.4);

	yield* statusText.text("Swapping 3 and 2", 0.2);
	yield* all(bar1("bg-red-500", 0.3), bar3("bg-red-500", 0.3));
	yield* waitFor(0.2);
	yield* all(bar1("translate-x-[60px]", 0.6), bar3("translate-x-0", 0.6));
	yield* waitFor(0.3);
	yield* all(bar1("bg-blue-500", 0.3), bar3("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Now order is: [2, 3, 5, 6*, 8*]
	yield* statusText.text("Comparing 3 and 5", 0.2);
	yield* all(bar1("bg-yellow-500", 0.3), bar0("bg-yellow-500", 0.3));
	yield* waitFor(0.4);
	yield* all(bar1("bg-blue-500", 0.3), bar0("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Mark 5 as sorted (at position 2)
	yield* bar0("bg-green-500", 0.5);
	yield* waitFor(0.2);

	// Pass 4 - Now order is: [2, 3, 5*, 6*, 8*]
	yield* statusText.text("Comparing 2 and 3", 0.2);
	yield* all(bar3("bg-yellow-500", 0.3), bar1("bg-yellow-500", 0.3));
	yield* waitFor(0.4);
	yield* all(bar3("bg-blue-500", 0.3), bar1("bg-blue-500", 0.3));
	yield* waitFor(0.2);

	// Mark 3 as sorted (at position 1)
	yield* bar1("bg-green-500", 0.5);
	yield* waitFor(0.2);

	// Mark 2 as sorted (at position 0)
	yield* bar3("bg-green-500", 0.5);

	yield* statusText.text("Sorted!", 0.5);
	yield* waitFor(2);
}
