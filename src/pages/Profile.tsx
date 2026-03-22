import { Link } from 'react-router-dom';
import { LogOut, ArrowLeft, Mail, User } from 'lucide-react';
import { FirebaseAuth } from '../api/auth';
import { useUserStore } from '../stores/user';
import { getPhotoURL } from '../services/utils';

export default function Profile() {
	const user = useUserStore(s => s.user);

	return (
		<div className="relative min-h-screen flex flex-col overflow-hidden">
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-800/[0.04] blur-2xl" />
				<div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-teal-700/[0.05] blur-3xl" />
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

				{/* Avatar */}
				<div className="mt-10 mb-6 animate-[fadeSlideIn_0.5s_0.1s_ease_both]">
					<div className="relative">
						<div className="absolute -inset-2 rounded-full bg-gradient-to-br from-emerald-600/15 to-teal-500/10 blur-sm" />
						<img
							src={getPhotoURL(user)}
							alt="profile"
							referrerPolicy="no-referrer"
							className="relative h-24 w-24 rounded-full border-[3px] border-white/90 shadow-lg shadow-stone-900/10"
						/>
					</div>
				</div>

				{/* Name */}
				<div className="mb-8 text-center animate-[fadeSlideIn_0.5s_0.15s_ease_both]">
					<h1 className="text-[1.5rem] font-bold tracking-tight text-stone-800">
						{user?.displayName}
					</h1>
					<p className="mt-0.5 text-xs font-medium tracking-wide text-stone-400 uppercase">
						Profile
					</p>
				</div>

				{/* Info card */}
				<div className="w-full max-w-sm animate-[fadeSlideIn_0.5s_0.2s_ease_both]">
					<div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm overflow-hidden">
						<div className="flex items-center gap-4 px-5 py-4 border-b border-stone-100/80">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
								<User className="h-4 w-4" strokeWidth={2} />
							</div>
							<div className="text-left">
								<p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide">Name</p>
								<p className="text-sm font-medium text-stone-700">{user?.displayName}</p>
							</div>
						</div>
						<div className="flex items-center gap-4 px-5 py-4">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
								<Mail className="h-4 w-4" strokeWidth={2} />
							</div>
							<div className="text-left">
								<p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide">Email</p>
								<p className="text-sm font-medium text-stone-700">{user?.email}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Logout button */}
				<div className="mt-8 animate-[fadeSlideIn_0.5s_0.3s_ease_both]">
					<button
						onClick={() => FirebaseAuth.signOut()}
						className="group flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-6 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 hover:border-red-300/60 active:scale-[0.98]"
					>
						<LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
						Log out
					</button>
				</div>
			</div>
		</div>
	);
}
