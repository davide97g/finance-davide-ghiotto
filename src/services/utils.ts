import type { User } from "firebase/auth";
import { toast } from "sonner";
import { setIsLoading } from "../stores/loading";

export { setIsLoading };

export const getPhotoURL = (user: User | null) => {
	return user?.photoURL || "/img/default-profile-pic.svg";
};

const nthNumber = (number: number) => {
	if (number > 3 && number < 21) return "th";
	switch (number % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
};

export const formatDate = (date: string, onlyDay?: boolean) => {
	const d = new Date(date);
	let month = "" + (d.getMonth() + 1);
	let day = "" + d.getDate();
	const year = d.getFullYear();

	if (onlyDay) return day + nthNumber(d.getDate());

	if (month.length < 2) month = "0" + month;
	if (day.length < 2) day = "0" + day;

	return [year, month, day].join("-");
};

export const openNotificationWithIcon = (
	type: string,
	message: string,
	description?: string,
) => {
	if (type === "success") {
		toast.success(message, { description, duration: 2000 });
	} else if (type === "error") {
		toast.error(message, { description, duration: 2000 });
	} else if (type === "warning") {
		toast.warning(message, { description, duration: 2000 });
	} else {
		toast.info(message, { description, duration: 2000 });
	}
};

export function clone<T>(object: T): T {
	return JSON.parse(JSON.stringify(object || {}));
}
export function equals<T>(obj1: T, obj2: T): boolean {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
}

const currentYear = new Date().getFullYear();

export const YEARS = Array.from(
	Array(currentYear - 2021).keys(),
	(index) => 2022 + index,
).map((y) => y.toString());
export const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
