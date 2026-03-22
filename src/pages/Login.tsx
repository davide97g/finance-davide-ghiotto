import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FirebaseAuth } from '../api/auth';
import { useUserStore } from '../stores/user';

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none">
			<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
			<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
			<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
			<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
		</svg>
	);
}

export default function Login() {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	const user = useUserStore(s => s.user);

	return (
		<div className="relative min-h-screen flex flex-col overflow-hidden">
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-800/[0.04] blur-2xl" />
				<div className="absolute bottom-1/4 -left-20 h-64 w-64 rounded-full bg-teal-700/[0.05] blur-3xl" />
			</div>

			<div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-8 pb-10">
				{/* Back button */}
				<Link
					to="/"
					className="self-start animate-[fadeSlideIn_0.5s_ease_both]"
				>
					<button className="flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-600">
						<ArrowLeft className="h-4 w-4" />
						Home
					</button>
				</Link>

				{isLoggedIn ? (
					/* Already logged in state */
					<div className="flex flex-1 flex-col items-center justify-center -mt-8">
						<div className="animate-[fadeSlideIn_0.5s_0.1s_ease_both] mb-6">
							<div className="relative">
								<div className="absolute -inset-2 rounded-full bg-gradient-to-br from-emerald-600/15 to-teal-500/10 blur-sm" />
								<img
									src={user?.photoURL || ''}
									alt="profile"
									referrerPolicy="no-referrer"
									className="relative h-20 w-20 rounded-full border-[3px] border-white/90 shadow-lg shadow-stone-900/10"
								/>
							</div>
						</div>

						<div className="text-center mb-8 animate-[fadeSlideIn_0.5s_0.15s_ease_both]">
							<p className="text-sm text-stone-400 mb-1">Signed in as</p>
							<p className="text-lg font-bold text-stone-800">{user?.displayName}</p>
						</div>

						<Link
							to="/"
							className="animate-[fadeSlideIn_0.5s_0.2s_ease_both]"
						>
							<button className="group flex items-center gap-2 rounded-xl bg-stone-800 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 transition-all duration-200 hover:bg-stone-700 hover:shadow-xl active:scale-[0.98]">
								Go to dashboard
								<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
							</button>
						</Link>
					</div>
				) : (
					/* Login state */
					<div className="flex flex-1 flex-col items-center justify-center -mt-8">
						{/* Lock icon area */}
						<div className="mb-8 animate-[fadeSlideIn_0.5s_0.1s_ease_both]">
							<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm">
								<svg className="h-8 w-8 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</div>
						</div>

						<div className="text-center mb-10 animate-[fadeSlideIn_0.5s_0.15s_ease_both]">
							<h2 className="text-[1.5rem] font-bold tracking-tight text-stone-800 mb-2">
								Welcome back
							</h2>
							<p className="text-sm text-stone-500 leading-relaxed max-w-[260px] mx-auto">
								Sign in with your Google account to access your personal finance dashboard.
							</p>
						</div>

						<div className="w-full max-w-sm animate-[fadeSlideIn_0.5s_0.2s_ease_both]">
							<button
								onClick={() => FirebaseAuth.signInWithGoogle()}
								className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200/70 px-6 py-4 shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md hover:shadow-stone-900/[0.06] hover:-translate-y-0.5 active:scale-[0.99]"
							>
								<GoogleIcon className="h-5 w-5" />
								<span className="text-sm font-semibold text-stone-700">
									Continue with Google
								</span>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
