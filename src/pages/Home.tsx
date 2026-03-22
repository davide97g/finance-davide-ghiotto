import { Link } from 'react-router-dom';
import { Euro, List, CheckSquare } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import Avatar from '../components/Avatar';
import Version from '../components/Version';
import { useUserStore } from '../stores/user';

export default function Home() {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	const isAdmin = useUserStore(s => s.isAdmin);

	return (
		<>
			{isLoggedIn && <Avatar position="topCenter" size="large" />}
			<div className="flex flex-col h-screen items-center justify-center">
				<Version />
				<h1 className="text-2xl font-bold mt-2">Personal Finance</h1>
				<p>Welcome to the Finance part of my website</p>
				<p>Here I managed my personal finances.</p>
				<Separator className="my-4 w-64" />
				{isLoggedIn !== undefined ? (
					!isLoggedIn ? (
						<Link to="/login">
							<Button>Login</Button>
						</Link>
					) : !isAdmin ? (
						<p>I'm sorry but the public areas of the website are still under construction.</p>
					) : (
						<div className="flex flex-col items-center gap-2.5">
							<Link to="/family">
								<Button><Euro className="mr-2 h-4 w-4" /> Family Balance</Button>
							</Link>
							<Link to="/groceries">
								<Button><List className="mr-2 h-4 w-4" /> Groceries</Button>
							</Link>
							<Link to="/todo">
								<Button><CheckSquare className="mr-2 h-4 w-4" /> Todo</Button>
							</Link>
						</div>
					)
				) : (
					<Loader2 className="h-8 w-8 animate-spin" />
				)}
			</div>
		</>
	);
}
