import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/user';

const MINIMUM_DISPLAY_MS = 1500;
const FADE_OUT_MS = 500;
const SESSION_KEY = 'splashShown';

export default function SplashScreen() {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	const user = useUserStore(s => s.user);
	const firstName = user?.displayName?.split(' ')[0] || '';

	const [timerDone, setTimerDone] = useState(false);
	const [fadingOut, setFadingOut] = useState(false);
	const [hidden, setHidden] = useState(
		() => !!sessionStorage.getItem(SESSION_KEY) || window.location.pathname === '/login'
	);

	useEffect(() => {
		const id = setTimeout(() => setTimerDone(true), MINIMUM_DISPLAY_MS);
		return () => clearTimeout(id);
	}, []);

	// If not logged in, dismiss immediately so the auth redirect can proceed
	useEffect(() => {
		if (isLoggedIn === false) {
			sessionStorage.setItem(SESSION_KEY, '1');
			setHidden(true);
		}
	}, [isLoggedIn]);

	useEffect(() => {
		if (!timerDone || isLoggedIn === undefined) return;
		setFadingOut(true);
		const id = setTimeout(() => {
			sessionStorage.setItem(SESSION_KEY, '1');
			setHidden(true);
		}, FADE_OUT_MS);
		return () => clearTimeout(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [timerDone, isLoggedIn]);

	if (hidden) return null;

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center"
			style={{
				backgroundColor: '#eaefea',
				opacity: fadingOut ? 0 : 1,
				transition: `opacity ${FADE_OUT_MS}ms ease`,
			}}
		>
			<div className="flex flex-col items-center">
				{/* Logo */}
				<div
					className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
					style={{
						background: 'linear-gradient(135deg, #059669, #0d9488)',
						animation: 'splash-scale-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
					}}
				>
					<svg
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="white"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-label="Logo"
						role="img"
					>
						<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
					</svg>
				</div>

				{/* Title */}
				<h1
					className="text-[1.5rem] font-bold tracking-tight text-stone-800"
					style={{
						animation: 'splash-fade-up 0.8s 0.3s ease both',
						fontFamily: "'Montserrat', sans-serif",
					}}
				>
					Personal Finance
				</h1>

				{/* Greeting */}
				<p
					className="mt-1.5 text-sm text-stone-500"
					style={{
						animation: 'splash-fade-up 0.8s 0.5s ease both',
						fontFamily: "'Montserrat', sans-serif",
					}}
				>
					{firstName ? `Welcome, ${firstName}` : 'Welcome'}
				</p>

				{/* Spinner */}
				<div
					className="mt-6"
					style={{ animation: 'splash-fade-up 0.8s 0.7s ease both' }}
				>
					<div
						className="h-5 w-5 rounded-full"
						style={{
							border: '2.5px solid #d6d3d1',
							borderTopColor: '#059669',
							animation: 'splash-spin 0.8s linear infinite',
						}}
					/>
				</div>
			</div>
		</div>
	);
}
