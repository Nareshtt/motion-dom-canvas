import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import motionDom from "@motion-dom/vite-plugin"; // Import the local plugin

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		motionDom(), // Activate it
	],
});
