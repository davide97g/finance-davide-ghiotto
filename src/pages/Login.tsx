import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Auth } from "../api/auth";
import { Input } from "../components/ui/input";
import { getPhotoURL } from "../services/utils";
import { useSyncStore } from "../stores/sync";
import { useUserStore } from "../stores/user";

export default function Login() {
	const isLoggedIn = useUserStore((s) => s.isLoggedIn);
	const user = useUserStore((s) => s.user);
	const isOnline = useSyncStore((s) => s.isOnline);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);
		try {
			await Auth.signInWithPassword(email.trim(), password);
			window.location.href = "/";
		} catch {
			setError("Wrong email or password.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="relative min-h-screen flex flex-col overflow-hidden">
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-800/[0.04] dark:bg-emerald-400/[0.06] blur-2xl" />
				<div className="absolute bottom-1/4 -left-20 h-64 w-64 rounded-full bg-teal-700/[0.05] dark:bg-teal-400/[0.06] blur-3xl" />
			</div>

			<div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-8 pb-10">
				{/* Back button — only when already logged in */}
				{isLoggedIn && (
					<Link
						to="/"
						className="self-start animate-[fadeSlideIn_0.5s_ease_both]"
					>
						<button
							type="button"
							className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
							Home
						</button>
					</Link>
				)}

				{isLoggedIn ? (
					/* Already logged in state */
					<div className="flex flex-1 flex-col items-center justify-center -mt-8">
						<div className="animate-[fadeSlideIn_0.5s_0.1s_ease_both] mb-6">
							<div className="relative">
								<div className="absolute -inset-2 rounded-full bg-gradient-to-br from-emerald-600/15 to-teal-500/10 blur-sm" />
								<img
									src={getPhotoURL(user)}
									alt="profile"
									referrerPolicy="no-referrer"
									className="relative h-20 w-20 rounded-full border-[3px] border-card/90 shadow-lg shadow-foreground/10"
								/>
							</div>
						</div>

						<div className="text-center mb-8 animate-[fadeSlideIn_0.5s_0.15s_ease_both]">
							<p className="text-sm text-muted-foreground mb-1">Signed in as</p>
							<p className="text-lg font-bold text-foreground">
								{user?.displayName}
							</p>
						</div>

						<Link to="/" className="animate-[fadeSlideIn_0.5s_0.2s_ease_both]">
							<button
								type="button"
								className="group flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-foreground/10 transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98]"
							>
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
							<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/70 backdrop-blur-sm border border-card/80 shadow-sm">
								<svg
									className="h-8 w-8 text-muted-foreground"
									viewBox="0 0 24 24"
									fill="none"
									aria-hidden="true"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</div>
						</div>

						<div className="text-center mb-10 animate-[fadeSlideIn_0.5s_0.15s_ease_both]">
							<h2 className="text-[1.5rem] font-bold tracking-tight text-foreground mb-2">
								Welcome back
							</h2>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
								Sign in to access your personal finance dashboard.
							</p>
						</div>

						<form
							onSubmit={submit}
							className="w-full max-w-sm space-y-3 animate-[fadeSlideIn_0.5s_0.2s_ease_both]"
						>
							<Input
								type="email"
								autoComplete="username"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="rounded-2xl bg-card/80 px-5 py-6 text-sm"
							/>
							<Input
								type="password"
								autoComplete="current-password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="rounded-2xl bg-card/80 px-5 py-6 text-sm"
							/>

							{error && (
								<p className="text-center text-xs text-destructive">{error}</p>
							)}

							<button
								type="submit"
								disabled={!isOnline || isSubmitting || !email || !password}
								className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-foreground/10 transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
							>
								{isSubmitting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<>
										Sign in
										<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
									</>
								)}
							</button>

							{/* Signing in is the one thing that needs the network. */}
							{!isOnline && (
								<p className="text-center text-xs text-muted-foreground">
									You are offline — connect once to sign in.
								</p>
							)}
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
