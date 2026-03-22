import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '../stores/loading';

export default function ProgressBar() {
	const isLoading = useLoadingStore(s => s.isLoading);

	if (!isLoading) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/25 z-[1000] pt-[70px]">
			<Loader2 className="h-[45px] w-[45px] animate-spin" />
		</div>
	);
}
