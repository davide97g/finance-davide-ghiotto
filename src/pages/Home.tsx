import { Link } from 'react-router-dom';
import { Euro, List, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import Avatar from '../components/Avatar';
import Version from '../components/Version';
import { useUserStore } from '../stores/user';

function getGreeting() {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 18) return 'Good afternoon';
	return 'Good evening';
}

const navItems = [
	{
		to: '/family',
		icon: Euro,
		label: 'Family Balance',
		desc: 'Track shared expenses and settlements',
		accent: 'from-emerald-500/10 to-teal-500/5',
		iconBg: 'bg-emerald-600/10 text-emerald-700',
	},
	{
		to: '/groceries',
		icon: List,
		label: 'Groceries',
		desc: 'Manage your shopping lists',
		accent: 'from-amber-500/10 to-orange-500/5',
		iconBg: 'bg-amber-600/10 text-amber-700',
	},
	{
		to: '/todo',
		icon: CheckSquare,
		label: 'Todo',
		desc: 'Keep track of tasks and reminders',
		accent: 'from-sky-500/10 to-blue-500/5',
		iconBg: 'bg-sky-600/10 text-sky-700',
	},
];

export default function Home() {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	const isAdmin = useUserStore(s => s.isAdmin);
	const user = useUserStore(s => s.user);

	const firstName = user?.displayName?.split(' ')[0] || '';

	return (
		<div className="relative min-h-screen flex flex-col overflow-hidden">
			{/* Decorative background shapes */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-800/[0.04] blur-2xl" />
				<div className="absolute top-1/3 -left-24 h-64 w-64 rounded-full bg-teal-700/[0.05] blur-3xl" />
				<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-stone-400/[0.04] blur-3xl" />
			</div>

			<div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-16 pb-10">
				{/* Avatar area */}
				{isLoggedIn && (
					<Link
						to="/profile"
						className="group mb-8 animate-[fadeSlideIn_0.5s_ease_both]"
					>
						<div className="relative">
							<div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-emerald-600/20 to-teal-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
							<img
								src={user?.photoURL || ''}
								alt="profile"
								referrerPolicy="no-referrer"
								className="relative h-20 w-20 rounded-full border-[3px] border-white/90 shadow-lg shadow-stone-900/10 transition-transform duration-300 group-hover:scale-105"
							/>
						</div>
					</Link>
				)}

				{/* Greeting & headline */}
				<div className="mb-10 text-center animate-[fadeSlideIn_0.5s_0.1s_ease_both]">
					{isLoggedIn && firstName && (
						<p className="mb-1 text-sm font-medium tracking-wide text-stone-400 uppercase">
							{getGreeting()}, {firstName}
						</p>
					)}
					<h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-stone-800">
						Personal Finance
					</h1>
					<p className="mt-2 text-sm leading-relaxed text-stone-500 max-w-[260px] mx-auto">
						Your personal hub for finances, groceries, and daily tasks.
					</p>
				</div>

				{/* Content */}
				{isLoggedIn !== undefined ? (
					!isLoggedIn ? (
						<Link
							to="/login"
							className="animate-[fadeSlideIn_0.5s_0.2s_ease_both]"
						>
							<button className="group flex items-center gap-2 rounded-xl bg-stone-800 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 transition-all duration-200 hover:bg-stone-700 hover:shadow-xl hover:shadow-stone-900/25 active:scale-[0.98]">
								Sign in to continue
								<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
							</button>
						</Link>
					) : !isAdmin ? (
						<div className="animate-[fadeSlideIn_0.5s_0.2s_ease_both] rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-200/60 px-6 py-5 text-center max-w-xs">
							<p className="text-sm text-stone-500 leading-relaxed">
								Public areas are still under construction. Check back soon.
							</p>
						</div>
					) : (
						<div className="flex w-full max-w-sm flex-col gap-3">
							{navItems.map((item, i) => (
								<Link
									key={item.to}
									to={item.to}
									className="group animate-[fadeSlideIn_0.5s_ease_both]"
									style={{ animationDelay: `${0.15 + i * 0.08}s` }}
								>
									<div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.accent} bg-white/70 backdrop-blur-sm border border-white/80 px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-stone-900/[0.06] hover:-translate-y-0.5 active:scale-[0.99]`}>
										<div className="flex items-center gap-4">
											<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} transition-transform duration-200 group-hover:scale-110`}>
												<item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
											</div>
											<div className="flex-1 text-left">
												<p className="text-[0.9rem] font-semibold text-stone-800 leading-tight">
													{item.label}
												</p>
												<p className="mt-0.5 text-xs text-stone-400 leading-snug">
													{item.desc}
												</p>
											</div>
											<ArrowRight className="h-4 w-4 text-stone-300 transition-all duration-200 group-hover:text-stone-500 group-hover:translate-x-0.5" />
										</div>
									</div>
								</Link>
							))}
						</div>
					)
				) : (
					<div className="animate-[fadeSlideIn_0.5s_0.2s_ease_both]">
						<Loader2 className="h-6 w-6 animate-spin text-stone-400" />
					</div>
				)}

				{/* Version at bottom */}
				<div className="mt-auto pt-10 animate-[fadeSlideIn_0.5s_0.4s_ease_both]">
					<Version />
				</div>
			</div>
		</div>
	);
}
