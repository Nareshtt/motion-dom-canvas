import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MotionCanvasApp } from "@motion-dom/ui";
import projectData from "virtual:motion-dom-scenes";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<MotionCanvasApp projectData={projectData} />
	</StrictMode>
);
