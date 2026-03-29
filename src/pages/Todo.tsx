import { useEffect, useState } from "react";
import { DataBaseClient } from "../api/db";
import ChecklistPage from "../components/ChecklistPage";
import type { Todo as TodoModel } from "../models/todo";

export default function Todo() {
	const [items, setItems] = useState<TodoModel[]>([]);

	useEffect(() => {
		let unsubscribe: (() => void) | undefined;
		DataBaseClient.Todo.getRT((todos: TodoModel[]) => {
			setItems(todos);
		}).then((unsub) => {
			unsubscribe = unsub;
		});
		return () => {
			unsubscribe?.();
		};
	}, []);

	return (
		<ChecklistPage
			title="Home Todo List"
			icon="🏠"
			items={items}
			onAdd={(label) => DataBaseClient.Todo.create({ label, checked: false })}
			onCheck={(item) =>
				DataBaseClient.Todo.update({ ...item, checked: !item.checked })
			}
			onDelete={(item) => DataBaseClient.Todo.delete(item.id)}
		/>
	);
}
