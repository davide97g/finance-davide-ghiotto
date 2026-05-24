import { ArrowLeft, LogOut, Mail, Moon, Rows3, Sun, User } from "lucide-react";
import { Link } from "react-router-dom";
import { FirebaseAuth } from "../api/auth";
import { useCompactMode } from "../hooks/useCompactMode";
import { useTheme } from "../hooks/useTheme";
import { getPhotoURL } from "../services/utils";
import { useUserStore } from "../stores/user";

const themeOptions = [
	{ value: "light" as const, icon: Sun, label: "Light" },
	{ value: "dark" as const, icon: Moon, label: "Dark" },
];

export default function Profile() {
	const user = useUserStore((s) => s.user);
	const { theme, setTheme } = useTheme();
	const { compactMode, setCompactMode } = useCompactMode();

	return (
		<div className="relative min-h-screen flex flex-col overflow-hidden">
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-800/[0.04] dark:bg-emerald-400/[0.06] blur-2xl" />
				<div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-teal-700/[0.05] dark:bg-teal-400/[0.06] blur-3xl" />
			</div>

			<div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-8 pb-10">
				{/* Back button */}
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

				{/* Avatar */}
				<div className="mt-10 mb-6 animate-[fadeSlideIn_0.5s_0.1s_ease_both]">
					<div className="relative">
						<div className="absolute -inset-2 rounded-full bg-gradient-to-br from-emerald-600/15 to-teal-500/10 blur-sm" />
						<img
							src={getPhotoURL(user)}
							alt="profile"
							referrerPolicy="no-referrer"
							className="relative h-24 w-24 rounded-full border-[3px] border-card/90 shadow-lg shadow-foreground/10"
						/>
					</div>
				</div>

				{/* Name */}
				<div className="mb-8 text-center animate-[fadeSlideIn_0.5s_0.15s_ease_both]">
					<h1 className="text-[1.5rem] font-bold tracking-tight text-foreground">
						{user?.displayName}
					</h1>
					<p className="mt-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Profile
					</p>
				</div>

				{/* Info card */}
				<div className="w-full max-w-sm animate-[fadeSlideIn_0.5s_0.2s_ease_both]">
					<div className="rounded-2xl bg-card/70 backdrop-blur-sm border border-card/80 shadow-sm overflow-hidden">
						<div className="flex items-center gap-4 px-5 py-4 border-b border-border/50">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
								<User className="h-4 w-4" strokeWidth={2} />
							</div>
							<div className="text-left">
								<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
									Name
								</p>
								<p className="text-sm font-medium text-foreground">
									{user?.displayName}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4 px-5 py-4">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
								<Mail className="h-4 w-4" strokeWidth={2} />
							</div>
							<div className="text-left">
								<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
									Email
								</p>
								<p className="text-sm font-medium text-foreground">
									{user?.email}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Theme selector */}
				<div className="w-full max-w-sm mt-6 animate-[fadeSlideIn_0.5s_0.25s_ease_both]">
					<div className="rounded-2xl bg-card/70 backdrop-blur-sm border border-card/80 shadow-sm overflow-hidden">
						<div className="px-5 py-4">
							<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
								Theme
							</p>
							<div className="flex gap-2">
								{themeOptions.map(({ value, icon: Icon, label }) => (
									<button
										type="button"
										key={value}
										onClick={() => setTheme(value)}
										className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
											theme === value
												? "bg-primary text-primary-foreground shadow-sm"
												: "bg-secondary text-muted-foreground hover:text-foreground"
										}`}
									>
										<Icon className="h-4 w-4" strokeWidth={2} />
										{label}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Compact mode toggle */}
				<div className="w-full max-w-sm mt-6 animate-[fadeSlideIn_0.5s_0.3s_ease_both]">
					<div className="rounded-2xl bg-card/70 backdrop-blur-sm border border-card/80 shadow-sm overflow-hidden">
						<div className="flex items-center justify-between gap-4 px-5 py-4">
							<div className="flex items-center gap-4">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
									<Rows3 className="h-4 w-4" strokeWidth={2} />
								</div>
								<div className="text-left">
									<p className="text-sm font-medium text-foreground">
										Compact list
									</p>
									<p className="text-[11px] text-muted-foreground">
										Show emoji instead of category name
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setCompactMode(!compactMode)}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
									compactMode ? "bg-primary" : "bg-secondary"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
										compactMode ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
				</div>

				{/* Logout button */}
				<div className="mt-8 animate-[fadeSlideIn_0.5s_0.35s_ease_both]">
					<button
						type="button"
						onClick={() => FirebaseAuth.signOut()}
						className="group flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/60 dark:border-red-800/40 px-6 py-3 text-sm font-semibold text-red-600 dark:text-red-400 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-950/80 hover:border-red-300/60 dark:hover:border-red-700/50 active:scale-[0.98]"
					>
						<LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
						Log out
					</button>
				</div>
			</div>
		</div>
	);
}
