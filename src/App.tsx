import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import ProgressBar from './components/ProgressBar';
import SplashScreen from './components/SplashScreen';
import { useUserStore } from './stores/user';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Family = React.lazy(() => import('./pages/Family'));
const Groceries = React.lazy(() => import('./pages/Groceries'));
const Todo = React.lazy(() => import('./pages/Todo'));
const MonthStats = React.lazy(() => import('./pages/MonthStats'));
const YearStats = React.lazy(() => import('./pages/YearStats'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	if (isLoggedIn === undefined) return null;
	if (!isLoggedIn) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

function useUpdatePrompt() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW();

	useEffect(() => {
		if (needRefresh) {
			toast('Update available', {
				description: 'A new version is ready.',
				duration: Infinity,
				action: {
					label: 'Update',
					onClick: () => updateServiceWorker(true),
				},
			});
		}
	}, [needRefresh, updateServiceWorker]);
}

export default function App() {
	useUpdatePrompt();
	return (
		<>
			<SplashScreen />
			<ProgressBar />
			<div id="router-view" className="h-screen overflow-auto">
				<Suspense fallback={null}>
					<Routes>
						<Route path="/" element={<Home />} />
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
