import type { Category } from "../models/category";
import type { Stats } from "../models/stats";
import { MONTHS } from "./utils";

/** Header of the aggregated CSV, in column order. */
const CSV_HEADER = [
	"year",
	"month",
	"month_number",
	"period",
	"type",
	"category",
	"amount",
];

const escapeCell = (value: string | number) => {
	const cell = `${value}`;
	return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
};

export const toCsv = (rows: (string | number)[][]) =>
	rows.map((row) => row.map(escapeCell).join(",")).join("\n");

/**
 * Flattens frozen stats into one tidy row per month/type/category, which is the
 * finest aggregation the stats collection holds (no single transactions).
 */
export const buildStatsCsvRows = (stats: Stats[], categories: Category[]) => {
	const categoryName = (id: string) =>
		categories.find((c) => c.id === id)?.name || "Unknown";

	const rows = stats.flatMap((monthStats) => {
		const monthNumber = MONTHS.indexOf(monthStats.month) + 1;
		const period =
			monthNumber > 0
				? `${monthStats.year}-${`${monthNumber}`.padStart(2, "0")}`
				: monthStats.year;
		return monthStats.categorySummary.map((summary) => ({
			year: monthStats.year,
			month: monthStats.month,
			monthNumber,
			period,
			type: monthStats.type,
			category: categoryName(summary.categoryId),
			amount: Math.round(summary.total * 100) / 100,
		}));
	});

	rows.sort(
		(a, b) =>
			a.year.localeCompare(b.year) ||
			a.monthNumber - b.monthNumber ||
			a.type.localeCompare(b.type) ||
			b.amount - a.amount,
	);

	return [
		CSV_HEADER,
		...rows.map((r) => [
			r.year,
			r.month,
			r.monthNumber,
			r.period,
			r.type,
			r.category,
			r.amount,
		]),
	];
};

export const downloadCsv = (filename: string, content: string) => {
	// BOM so Excel opens accented category names correctly.
	const blob = new Blob([`﻿${content}`], {
		type: "text/csv;charset=utf-8;",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};
