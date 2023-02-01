import { defineStore } from 'pinia';
import { Category } from '../models/category';
import { Client, Nail } from '../models/nail';

export const useNailStore = defineStore('nail', {
	state: () => {
		return {
			nails: [] as Nail[],
			categories: [] as Category[],
			clients: [] as Client[],
			sorting: 'descending' as 'descending' | 'ascending',
		};
	},
	actions: {
		setClients(clients: Client[]) {
			const newClients = clients.filter(e => !this.clients.find(n => n.id === e.id));
			newClients.forEach(n => this.addClient(n));

			const presentClients = clients.filter(e => this.clients.find(n => n.id === e.id));
			presentClients.forEach(n => this.updateClient(n));
		},
		addClient(client: Client) {
			if (this.clients.find(t => t.id === client.id)) return;
			else this.clients.push(client);
			this.sortClients();
		},
		removeClient(client: Client) {
			this.clients = this.clients.filter(t => t.id !== client.id);
			this.sortClients();
		},
		updateClient(client: Client) {
			const index = this.clients.findIndex(t => t.id === client.id);
			if (index < 0) return;
			else this.clients[index] = client;
			this.sortClients();
		},
		sortClients(ascending?: boolean) {
			this.sorting = ascending ? 'ascending' : 'descending';
			this.clients.sort((a, b) => (a.name > b.name ? 1 : -1) * (ascending ? 1 : -1));
		},
		setNails(nails: Nail[]) {
			const newNails = nails.filter(e => !this.nails.find(n => n.id === e.id));
			newNails.forEach(n => this.addNail(n));

			const presentNails = nails.filter(e => this.nails.find(n => n.id === e.id));
			presentNails.forEach(n => this.updateNail(n));
		},
		addNail(nail: Nail) {
			if (this.nails.find(t => t.id === nail.id)) return;
			else this.nails.push(nail);
			this.sortNails();
		},
		removeNail(nail: Nail) {
			this.nails = this.nails.filter(t => t.id !== nail.id);
			this.sortNails();
		},
		updateNail(nail: Nail) {
			const index = this.nails.findIndex(t => t.id === nail.id);
			if (index < 0) return;
			else this.nails[index] = nail;
			this.sortNails();
		},
		sortNails(ascending?: boolean) {
			this.sorting = ascending ? 'ascending' : 'descending';
			this.nails.sort(
				(a, b) =>
					(new Date(a.datetime).getTime() - new Date(b.datetime).getTime() ? 1 : -1) *
					(ascending ? 1 : -1)
			);
		},
	},
});
