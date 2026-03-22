import { Button } from '../components/ui/button';
import { FirebaseAuth } from '../api/auth';
import { useUserStore } from '../stores/user';
import { Link } from 'react-router-dom';

export default function Login() {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	const user = useUserStore(s => s.user);

	return (
		<div className="flex items-center justify-center h-full p-5">
			{isLoggedIn ? (
				<div>
					<p>You are logged as: {user?.displayName}</p>
					<Link to="/">
						<Button>Home</Button>
					</Link>
				</div>
			) : (
				<div>
					<h2 className="text-xl font-semibold">It seems like I don't recongnize you...</h2>
					<p>Please, login with Google to access private areas of this app.</p>
					<Button onClick={() => FirebaseAuth.signInWithGoogle()}>
						Sign in with Google
					</Button>
				</div>
			)}
		</div>
	);
}
