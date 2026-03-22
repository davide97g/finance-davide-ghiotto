import { Link } from 'react-router-dom';
import { getPhotoURL } from '../services/utils';
import { useUserStore } from '../stores/user';

interface Props {
	position: 'topLeft' | 'topRight' | 'topCenter';
	size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
	small: 'h-[45px] w-[45px]',
	medium: 'h-[60px] w-[60px]',
	large: 'h-[75px] w-[75px]',
};

const positionClasses = {
	topLeft: 'top-[5px] left-[5px]',
	topCenter: 'top-[5px] left-0 right-0 mx-auto w-fit',
	topRight: 'top-[5px] right-[5px]',
};

export default function Avatar({ position, size = 'small' }: Props) {
	const isLoggedIn = useUserStore(s => s.isLoggedIn);
	const user = useUserStore(s => s.user);

	if (!isLoggedIn) return null;

	return (
		<div className={`absolute z-10 ${positionClasses[position]}`}>
			<Link to="/profile">
				<img
					src={getPhotoURL(user)}
					alt="profile-img"
					title={user?.displayName || ''}
					referrerPolicy="no-referrer"
					className={`rounded-full border border-white ${sizeClasses[size]}`}
				/>
			</Link>
		</div>
	);
}
