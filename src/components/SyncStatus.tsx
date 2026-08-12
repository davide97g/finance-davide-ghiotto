import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { openNotificationWithIcon } from "../services/utils";
import { selectPendingCount, useSyncStore } from "../stores/sync";

interface Props {
	className?: string;
}

/**
 * Chip showing whether the app is working from the local cache and how many
 * writes are still queued. Nothing is rendered while online and fully synced.
 */
export default function SyncStatus({ className }: Props) {
	const isOnline = useSyncStore((s) => s.isOnline);
	const pending = useSyncStore(selectPendingCount);
	const hadPending = useRef(false);

	useEffect(() => {
		if (pending > 0) {
			hadPending.current = true;
			return;
		}
		if (hadPending.current && isOnline) {
			hadPending.current = false;
			openNotificationWithIcon("success", "Synced", "All changes are saved");
		}
	}, [pending, isOnline]);

	if (isOnline && pending === 0) return null;

	const offline = !isOnline;
	const label = offline
		? pending > 0
			? `Offline · ${pending}`
			: "Offline"
		: `Syncing ${pending}`;

	return (
		<span
			className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
				offline
					? "bg-foreground/[0.07] text-muted-foreground"
					: "bg-earning/10 text-earning"
			} ${className || ""}`}
			title={
				offline
					? "Working offline — changes are saved on this device and sync when you are back"
					: "Sending queued changes to the server"
			}
		>
			{offline ? (
				<CloudOff className="h-3 w-3" />
			) : (
				<RefreshCw className="h-3 w-3 animate-spin" />
			)}
			{label}
		</span>
	);
}
