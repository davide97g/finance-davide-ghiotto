import { useState, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import Avatar from '../components/Avatar';
import { DataBaseClient } from '../api/db';
import { Todo as TodoModel } from '../models/todo';

export default function Todo() {
	const [items, setItems] = useState<TodoModel[]>([]);
	const [newItem, setNewItem] = useState('');

	useEffect(() => {
		let unsubscribe: (() => void) | undefined;
		DataBaseClient.Todo.getRT((todos: TodoModel[]) => {
			setItems(todos);
		}).then(unsub => {
			unsubscribe = unsub;
		});
		return () => {
			unsubscribe?.();
		};
	}, []);

	const sortedItems = useMemo(() => {
		return [...items].sort((i1, i2) => {
			const c1 = i1.checked ? 1 : -1;
			const c2 = i2.checked ? 1 : -1;
			const diff = c1 - c2;
			if (!diff) return i1.label.localeCompare(i2.label);
			return c1 - c2;
		});
	}, [items]);

	const addNewItem = () => {
		if (newItem) {
			DataBaseClient.Todo.create({ label: newItem, checked: false }).then(() => {
				setNewItem('');
			});
		}
	};

	const onCheck = (item: TodoModel) => {
		DataBaseClient.Todo.update({ ...item, checked: !item.checked });
	};

	const deleteItem = (item: TodoModel) => {
		DataBaseClient.Todo.delete(item.id);
	};

	return (
		<>
			<Avatar position="topLeft" />
			<h1 className="text-2xl font-bold">Home Todo List</h1>
			<p>Here is a list of things to do</p>
			<div className="flex px-4">
				<Input
					value={newItem}
					onChange={e => setNewItem(e.target.value)}
					placeholder="Add new"
					onKeyDown={e => e.key === 'Enter' && addNewItem()}
				/>
				<Button onClick={addNewItem} disabled={!newItem}>
					Add <Plus className="ml-1 h-4 w-4" />
				</Button>
			</div>
			<Separator className="my-4" />
			<div className="px-4 flex flex-col gap-2 items-start max-h-[calc(100vh-200px)] overflow-y-auto">
				{sortedItems.map(item => (
					<div key={item.id} className="flex justify-between items-center w-full">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={item.checked}
								onCheckedChange={() => onCheck(item)}
							/>
							<span className={item.checked ? 'line-through' : ''}>
								{item.label}
							</span>
						</div>
						<X className="h-4 w-4 cursor-pointer" onClick={() => deleteItem(item)} />
					</div>
				))}
			</div>
		</>
	);
}
