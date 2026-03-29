import { useEffect, useState } from "react";
import { DataBaseClient } from "../api/db";
import ChecklistPage from "../components/ChecklistPage";
import type { Grocery } from "../models/grocery";

export default function Groceries() {
	const [items, setItems] = useState<Grocery[]>([]);

	useEffect(() => {
		let unsubscribe: (() => void) | undefined;
		DataBaseClient.Grocery.getRT((groceries: Grocery[]) => {
			setItems(groceries);
		}).then((unsub) => {
			unsubscribe = unsub;
		});
		return () => {
			unsubscribe?.();
		};
	}, []);

	return (
		<ChecklistPage
			title="Groceries"
			icon="🛒"
			items={items}
			filterWhileTyping
			onAdd={(label) =>
				DataBaseClient.Grocery.create({ label, checked: false })
			}
			onCheck={(item) =>
				DataBaseClient.Grocery.update({ ...item, checked: !item.checked })
			}
			onDelete={(item) => DataBaseClient.Grocery.delete(item.id)}
		/>
	);
}
