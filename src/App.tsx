import { useRegisterSW } from "virtual:pwa-register/react";
import React, { Suspense, useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProgressBar from "./components/ProgressBar";
import SplashScreen from "./components/SplashScreen";
import { useUserStore } from "./stores/user";

const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Login"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Family = React.lazy(() => import("./pages/Family"));
const Groceries = React.lazy(() => import("./pages/Groceries"));
const Todo = React.lazy(() => import("./pages/Todo"));
const MonthStats = React.lazy(() => import("./pages/MonthStats"));
const YearStats = React.lazy(() => import("./pages/YearStats"));
const Trends = React.lazy(() => import("./pages/Trends"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isLoggedIn = useUserStore((s) => s.isLoggedIn);
	if (isLoggedIn === undefined) return null;
	if (!isLoggedIn) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Keeps the app on the latest deploy. The service worker is registered with
 * registerType "autoUpdate": once a new worker installs it skips waiting and
 * the page reloads on its own. Browsers only look for a new worker on
 * navigation, so an installed PWA left open also polls for updates here.
 */
function useAutoUpdate() {
	const registrationRef = useRef<ServiceWorkerRegistration | undefined>(
		undefined,
	);

	useRegisterSW({
		immediate: true,
		onRegisteredSW(_swUrl, registration) {
			registrationRef.current = registration;
		},
	});

	useEffect(() => {
		const checkForUpdate = () => {
			const registration = registrationRef.current;
			if (!registration || registration.installing || !navigator.onLine) return;
			registration.update().catch(() => {});
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") checkForUpdate();
		};

		const interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("online", checkForUpdate);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("online", checkForUpdate);
		};
	}, []);
}

export default function App() {
	useAutoUpdate();
	return (
		<>
			<SplashScreen />
			<ProgressBar />
			<div id="router-view" className="h-screen overflow-auto">
				<Suspense fallback={null}>
					<Routes>
						<Route
							path="/"
							element={
								<ProtectedRoute>
									<Home />
								</ProtectedRoute>
							}
						/>
						<Route path="/login" element={<Login />} />
						<Route
							path="/profile"
							element={
								<ProtectedRoute>
									<Profile />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/family"
							element={
								<ProtectedRoute>
									<Family />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/stats/month"
							element={
								<ProtectedRoute>
									<MonthStats />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/stats/year"
							element={
								<ProtectedRoute>
									<YearStats />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/stats/trends"
							element={
								<ProtectedRoute>
									<Trends />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/groceries"
							element={
								<ProtectedRoute>
									<Groceries />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/todo"
							element={
								<ProtectedRoute>
									<Todo />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</Suspense>
			</div>
		</>
	);
}
