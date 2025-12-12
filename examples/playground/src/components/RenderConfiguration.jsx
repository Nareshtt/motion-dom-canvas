import React from "react";
import { X } from "lucide-react";

export function RenderConfiguration({ config, onConfigChange, onClose }) {
	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-96 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white">Render Settings</h2>
					<button onClick={onClose} className="text-zinc-400 hover:text-white">
						<X size={20} />
					</button>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
							Exporter
						</label>
						<select
							value={config.format}
							onChange={(e) =>
								onConfigChange({ ...config, format: e.target.value })
							}
							className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
						>
							<option value="mp4">Video (MP4)</option>
							<option value="image_sequence">Image Sequence (PNG)</option>
						</select>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
							FPS
						</label>
						<select
							value={config.fps}
							onChange={(e) =>
								onConfigChange({ ...config, fps: Number(e.target.value) })
							}
							className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
						>
							<option value={30}>30 FPS</option>
							<option value={60}>60 FPS</option>
						</select>
					</div>

					<div className="pt-4">
						<button
							onClick={onClose}
							className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors"
						>
							Save & Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
