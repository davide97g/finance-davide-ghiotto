<template>
	<div class="flex flex-col gap-4 items-start">
		<button
			class="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
			aria-label="Export Categories"
			tabindex="0"
			@click="handleExportCategories"
			@keydown.enter="handleExportCategories"
			@keydown.space="handleExportCategories"
		>
			Export Categories
		</button>
		<button
			class="px-4 py-2 rounded bg-green-600 text-white font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
			aria-label="Export Tags"
			tabindex="0"
			@click="handleExportTags"
			@keydown.enter="handleExportTags"
			@keydown.space="handleExportTags"
		>
			Export Tags
		</button>
		<button
			class="px-4 py-2 rounded bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
			aria-label="Export Transactions"
			tabindex="0"
			@click="handleExportTransactions"
			@keydown.enter="handleExportTransactions"
			@keydown.space="handleExportTransactions"
		>
			Export Transactions
		</button>
	</div>
</template>

<script setup lang="ts">
import { exportCategories, exportTags, exportTransactions } from '../services/exportUtils';

const handleExportCategories = () => exportCategories();
const handleExportTags = () => exportTags();
const handleExportTransactions = () => exportTransactions();
</script>
