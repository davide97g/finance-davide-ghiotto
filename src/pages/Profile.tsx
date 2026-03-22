import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import Avatar from '../components/Avatar';
import { FirebaseAuth } from '../api/auth';
import { useUserStore } from '../stores/user';

export default function Profile() {
	const user = useUserStore(s => s.user);

	return (
		<>
			<Avatar position="topCenter" size="large" />
			<div className="mt-[170px] mb-5">
				<h1 className="text-2xl font-bold">Profile</h1>
				<p>Name: {user?.displayName}</p>
				<p>Email: {user?.email}</p>
				<Button variant="destructive" onClick={() => FirebaseAuth.signOut()}>
					Log out
				</Button>
			</div>
			<Link to="/">
				<Button>Home</Button>
			</Link>
		</>
	);
}
