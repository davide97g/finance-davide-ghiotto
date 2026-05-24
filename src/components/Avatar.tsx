import { Link } from "react-router-dom";
import { getPhotoURL } from "../services/utils";
import { useUserStore } from "../stores/user";

interface Props {
	position?: "topLeft" | "topRight" | "topCenter";
	size?: "small" | "medium" | "large";
	className?: string;
}

const sizeClasses = {
	small: "h-7 w-7",
	medium: "h-[60px] w-[60px]",
	large: "h-[75px] w-[75px]",
};

const positionClasses = {
	topLeft: "absolute z-10 top-[5px] left-[5px]",
	topCenter: "absolute z-10 top-[5px] left-0 right-0 mx-auto w-fit",
	topRight: "absolute z-10 top-[5px] right-[5px]",
};

export default function Avatar({
	position,
	size = "small",
	className = "",
}: Props) {
	const isLoggedIn = useUserStore((s) => s.isLoggedIn);
	const user = useUserStore((s) => s.user);

	if (!isLoggedIn) return null;

	const wrapperClass = position ? positionClasses[position] : className;

	return (
		<div className={wrapperClass}>
			<Link to="/profile">
				<img
					src={getPhotoURL(user)}
					alt="profile-img"
					title={user?.displayName || ""}
					referrerPolicy="no-referrer"
					className={`rounded-full border-2 border-card/80 shadow-sm ${sizeClasses[size]}`}
				/>
			</Link>
		</div>
	);
}
