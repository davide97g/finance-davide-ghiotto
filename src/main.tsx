import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./style.css";
import { Toaster } from "sonner";
import { checkUserIsLoggedIn } from "./api/auth";

checkUserIsLoggedIn().catch(() => {});

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
			<Toaster
				position="top-center"
				toastOptions={{
					className: "custom-toast",
					style: {
						fontFamily: "'Montserrat', sans-serif",
					},
				}}
			/>
		</BrowserRouter>
	</React.StrictMode>,
);
