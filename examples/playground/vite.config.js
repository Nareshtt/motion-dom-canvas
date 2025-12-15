import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import motionDom from "@motion-dom/vite-plugin";
import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			react: path.resolve(__dirname, "../../node_modules/react"),
			"react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
		},
	},
	plugins: [
		react(),
		tailwindcss({
			config: {
				content: [
					"./index.html",
					"./src/**/*.{js,ts,jsx,tsx}",
					path.resolve(__dirname, "../../packages/ui/src/**/*.{jsx,js}"),
				],
			},
		}),
		motionDom(),
	],
});
