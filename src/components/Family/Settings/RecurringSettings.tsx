import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DataBaseClient } from "../../../api/db";
import type { Recurring } from "../../../models/recurring";
import { openNotificationWithIcon } from "../../../services/utils";
import { useCategoryStore } from "../../../stores/category";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../ui/alert-dialog";
import { Checkbox } from "../../ui/checkbox";
import { Separator } from "../../ui/separator";

export default function RecurringSettings() {
	const [recurrings, setRecurrings] = useState<Recurring[]>([]);
	const [loading, setLoading] = useState(true);
	const categories = useCategoryStore((s) => s.categories);

	useEffect(() => {
		DataBaseClient.Recurring.get()
			.then(setRecurrings)
			.catch((err) => console.error(err))
			.finally(() => setLoading(false));
	}, []);

	const toggleActive = (recurring: Recurring, active: boolean) => {
		const updated = { ...recurring, active };
		setRecurrings((prev) =>
			prev.map((r) => (r.id === recurring.id ? updated : r)),
		);
		DataBaseClient.Recurring.update(updated).catch((err) => {
			console.error(err);
			setRecurrings((prev) =>
				prev.map((r) => (r.id === recurring.id ? recurring : r)),
			);
		});
	};

	const remove = (recurring: Recurring) => {
		DataBaseClient.Recurring.delete(recurring.id)
			.then(() => {
				setRecurrings((prev) => prev.filter((r) => r.id !== recurring.id));
				openNotificationWithIcon("success", "Deleted", "Recurring removed");
			})
			.catch((err) => {
				console.error(err);
				openNotificationWithIcon(
					"error",
					"Error",
					"Could not delete recurring",
				);
			});
	};

	return (
		<div className="text-left">
			<h4 className="font-semibold mb-2">Recurring</h4>
			{loading ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : recurrings.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					None yet. Tick “Repeat every month” when creating a transaction.
				</p>
			) : (
				<div className="flex flex-col gap-2 max-h-[300px] overflow-auto">
					{recurrings.map((recurring) => {
						const category = categories.find(
							(c) => c.id === recurring.category,
						);
						return (
							<div
								key={recurring.id}
								className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-2.5 py-2"
							>
								<Checkbox
									checked={recurring.active}
									onCheckedChange={(checked) =>
										toggleActive(recurring, checked === true)
									}
								/>
								<div
									className={`min-w-0 flex-1 ${recurring.active ? "" : "opacity-50"}`}
								>
									<div className="flex items-center gap-1.5">
										<span
											className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
											style={{ backgroundColor: category?.color || "#ababab" }}
										>
											{category?.name || "?"}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{recurring.description || "—"}
										</span>
									</div>
									<span className="text-[11px] text-muted-foreground">
										day {recurring.dayOfMonth} · last {recurring.lastPeriod}
									</span>
								</div>
								<span
									className={`shrink-0 text-sm font-semibold ${
										recurring.type === "expense"
											? "text-expense"
											: "text-earning"
									}`}
								>
									{recurring.amount} €
								</span>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<button type="button" className="shrink-0 p-1">
											<Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
										</button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Delete this recurring? Existing transactions stay.
											</AlertDialogTitle>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>No</AlertDialogCancel>
											<AlertDialogAction onClick={() => remove(recurring)}>
												Yes
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						);
					})}
				</div>
			)}
			<Separator className="my-4" />
		</div>
	);
}
