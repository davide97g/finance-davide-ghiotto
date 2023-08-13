import { defineStore } from 'pinia';
import { Tag } from '../models/tag';

export const useTagStore = defineStore('tag', {
	state: () => {
		return {
			tags: [] as Tag[],
		};
	},
	actions: {
		setTags(tags: Tag[]) {
			const newTags = tags.filter(e => !this.tags.find(t => t.id === e.id));
			newTags.forEach(c => this.addTag(c));

			const presentTags = tags.filter(e => this.tags.find(c => c.id === e.id));
			presentTags.forEach(c => this.updateTag(c));
		},
		addTag(tag: Tag) {
			this.tags.push(tag);
		},
		updateTag(tag: Tag) {
			const i = this.tags.findIndex(c => c.id === tag.id);
			this.tags[i] = tag;
		},
		removeTag(tag: Tag) {
			this.tags.splice(
				this.tags.findIndex(c => c.id === tag.id),
				1
			);
		},
	},
});
