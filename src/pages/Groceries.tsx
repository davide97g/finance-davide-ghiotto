import { DataBaseClient } from "../api/db";
import ChecklistPage from "../components/ChecklistPage";
import { useChecklist } from "../hooks/useChecklist";
import type { Grocery } from "../models/grocery";

export default function Groceries() {
	const { items, error, dismissError, toggle, add, remove } =
		useChecklist<Grocery>(DataBaseClient.Grocery);

	return (
		<ChecklistPage
			title="Groceries"
			icon="🛒"
			items={items}
			filterWhileTyping
			error={error}
			onDismissError={dismissError}
			onAdd={add}
			onCheck={toggle}
			onDelete={remove}
		/>
	);
}
