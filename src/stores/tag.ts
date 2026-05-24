import { create } from "zustand";
import type { Tag } from "../models/tag";

interface TagState {
	tags: Tag[];
	setTags: (tags: Tag[]) => void;
	addTag: (tag: Tag) => void;
	updateTag: (tag: Tag) => void;
	removeTag: (tag: Tag) => void;
}

export const useTagStore = create<TagState>((set) => ({
	tags: [],
	setTags: (tags: Tag[]) => {
		set((state) => {
			const newTags = tags.filter(
				(e) => !state.tags.find((t) => t.id === e.id),
			);
			const presentTags = tags.filter((e) =>
				state.tags.find((c) => c.id === e.id),
			);
			let updated = [...state.tags];
			presentTags.forEach((c) => {
				updated = updated.map((existing) =>
					existing.id === c.id ? c : existing,
				);
			});
			return { tags: [...updated, ...newTags] };
		});
	},
	addTag: (tag: Tag) => {
		set((state) => ({ tags: [...state.tags, tag] }));
	},
	updateTag: (tag: Tag) => {
		set((state) => ({
			tags: state.tags.map((t) => (t.id === tag.id ? tag : t)),
		}));
	},
	removeTag: (tag: Tag) => {
		set((state) => ({
			tags: state.tags.filter((t) => t.id !== tag.id),
		}));
	},
}));
