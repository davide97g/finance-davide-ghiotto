import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { DataBaseClient } from "../../../api/db";
import { MONTHS, openNotificationWithIcon } from "../../../services/utils";
import { useCategoryUsageStore } from "../../../stores/categoryUsage";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";

function getLast3Months(): { month: string; year: string }[] {
	const now = new Date();
	const result: { month: string; year: string }[] = [];
	for (let i = 0; i < 3; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		result.push({
			month: MONTHS[d.getMonth()],
			year: d.getFullYear().toString(),
		});
	}
	return result;
}

export default function CategoryUsageRefresh() {
	const [loading, setLoading] = useState(false);
	const lastRefreshed = useCategoryUsageStore((s) => s.lastRefreshed);

	const handleRefresh = async () => {
		setLoading(true);
		try {
			const windows = getLast3Months();
			const allTransactions = await Promise.all(
				windows.map((w) =>
					DataBaseClient.Transaction.get({
						type: "expense",
						month: w.month,
						year: w.year,
					}),
				),
			);
			const counts: Record<string, number> = {};
			for (const transactions of allTransactions) {
				for (const t of transactions) {
					counts[t.category] = (counts[t.category] || 0) + 1;
				}
			}
			const now = new Date().toISOString();
			await DataBaseClient.CategoryUsage.set({ counts, lastRefreshed: now });
			useCategoryUsageStore.getState().setCategoryUsage(counts, now);
			openNotificationWithIcon(
				"success",
				"Success",
				"Category usage refreshed",
			);
		} catch (err) {
			console.error(err);
			openNotificationWithIcon(
				"error",
				"Error",
				"Failed to refresh category usage",
			);
		} finally {
			setLoading(false);
		}
	};

	const formatLastRefreshed = () => {
		if (!lastRefreshed) return "Never refreshed";
		const diff = Date.now() - new Date(lastRefreshed).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return "Last refreshed: today";
		if (days === 1) return "Last refreshed: yesterday";
		return `Last refreshed: ${days} days ago`;
	};

	return (
		<div className="text-left">
			<Separator className="my-4" />
			<h4 className="font-semibold mb-2">Utilities</h4>
			<div className="flex items-center gap-3">
				<Button
					onClick={handleRefresh}
					disabled={loading}
					className="flex items-center gap-2"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					Refresh Category Usage
				</Button>
			</div>
			<p className="text-xs text-muted-foreground mt-2">
				{formatLastRefreshed()}
			</p>
		</div>
	);
}
