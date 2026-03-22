import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { openNotificationWithIcon, setIsLoading } from '../../../services/utils';
import { DataBaseClient } from '../../../api/db';
import { useTagStore } from '../../../stores/tag';
import { Tag } from '../../../models/tag';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; tag: Tag; }

export default function UpdateTagPopup({ open, onOpenChange, tag: propTag }: Props) {
	const [tag, setTag] = useState<Tag>(JSON.parse(JSON.stringify(propTag)));
	useEffect(() => { setTag(JSON.parse(JSON.stringify(propTag))); }, [propTag]);
	const updateField = (field: string, value: any) => setTag(prev => ({ ...prev, [field]: value }));

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Tag.update(tag)
			.then(() => {
				openNotificationWithIcon('success', 'Success', 'Tag ' + tag.name + ' updated');
				useTagStore.getState().updateTag(tag);
				onOpenChange(false);
			})
			.catch(err => console.error(err))
			.finally(() => setIsLoading(false));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader><DialogTitle>Modify Tag</DialogTitle></DialogHeader>
				<div className="flex flex-col gap-3 items-start">
					<div className="w-full">
						<p className="text-sm mb-1">Name</p>
						<Input type="text" value={tag.name} onChange={e => updateField('name', e.target.value)} placeholder="Ex. ABC23" maxLength={5} />
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Description</p>
						<Input type="text" value={tag.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="Optional description" />
					</div>
					<div>
						<p className="text-sm mb-1">Color</p>
						<input type="color" value={tag.color || '#ababab'} onChange={e => updateField('color', e.target.value)} className="h-10 w-10 cursor-pointer" />
					</div>
				</div>
				<Separator />
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center justify-around">
						<p className="text-sm">Previous</p>
						<Badge style={{ backgroundColor: propTag.color, color: 'white' }}>{propTag.name}</Badge>
					</div>
					{tag.name && (
						<div className="flex items-center justify-around">
							<p className="text-sm">Preview</p>
							<Badge style={{ backgroundColor: tag.color, color: 'white' }}>{tag.name}</Badge>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button onClick={handleOk} disabled={!tag.name}>Update</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
