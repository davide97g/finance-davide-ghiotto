import { DataBaseClient } from "../api/db";
import ChecklistPage from "../components/ChecklistPage";
import { useChecklist } from "../hooks/useChecklist";
import type { Todo as TodoModel } from "../models/todo";

export default function Todo() {
	const { items, error, dismissError, toggle, add, remove } =
		useChecklist<TodoModel>(DataBaseClient.Todo);

	return (
		<ChecklistPage
			title="Home Todo List"
			icon="🏠"
			items={items}
			error={error}
			onDismissError={dismissError}
			onAdd={add}
			onCheck={toggle}
			onDelete={remove}
		/>
	);
}
