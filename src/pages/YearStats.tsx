import { ArrowLeft, ChevronDown, Download, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	LabelList,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import { DataBaseClient } from "../api/db";
import { Button } from "../components/ui/button";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "../components/ui/chart";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../components/ui/tabs";
import YearBalanceCard from "../components/YearBalanceCard";
import type { Category } from "../models/category";
import type { IStats, Stats } from "../models/stats";
import type { Transaction } from "../models/transaction";
import { buildStatsCsvRows, downloadCsv, toCsv } from "../services/export";
import {
	formatDate,
	openNotificationWithIcon,
	setIsLoading,
} from "../services/utils";
import { useCategoryStore } from "../stores/category";
import { useStatsStore } from "../stores/stats";
import { useTagStore } from "../stores/tag";

/** Tag assigned by default on new transactions: treated as "no tag". */
const DEFAULT_TAG_ID = "XB0kK9DnZIIEsPKsaWEB";
const UNTAGGED_KEY = "__untagged__";

interface TagGroup {
	key: string;
	name: string;
	color: string;
	total: number;
	percentage: number;
	transactions: Transaction[];
}

export default function YearStats() {
	const [searchParams] = useSearchParams();
	const year = searchParams.get("year") || new Date().getFullYear().toString();

	const stats = useStatsStore((s) => s.stats);
	const categories = useCategoryStore((s) => s.categories);
	const tags = useTagStore((s) => s.tags);
	const [yearExpenses, setYearExpenses] = useState<Transaction[]>([]);

	const yearlyEarnings = useMemo(
		() => stats.filter((s) => s.type === "earning" && s.year === year),
		[stats, year],
	);
	const yearlyExpenses = useMemo(
		() => stats.filter((s) => s.type === "expense" && s.year === year),
		[stats, year],
	);

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				// Ensure categories are loaded (needed after page refresh)
				if (useCategoryStore.getState().categories.length === 0) {
					const cats = await DataBaseClient.Category.get();
					useCategoryStore.getState().setCategories(cats);
				}
				if (useTagStore.getState().tags.length === 0) {
					const loadedTags = await DataBaseClient.Tag.get();
					useTagStore.getState().setTags(loadedTags);
				}
				const [results, expenses] = await Promise.all([
					DataBaseClient.Stats.getByYear(year),
					DataBaseClient.Transaction.get({ type: "expense", year }),
				]);
				useStatsStore.getState().setStats(results);
				setYearExpenses(expenses);
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [year]);

	const totalSumExpenses = useMemo(
		() => -1 * yearlyExpenses.reduce((acc, curr) => acc + curr.total, 0),
		[yearlyExpenses],
	);
	const totalSumEarnings = useMemo(
		() => yearlyEarnings.reduce((acc, curr) => acc + curr.total, 0),
		[yearlyEarnings],
	);
	const balance = totalSumEarnings + totalSumExpenses;
	const savingRate = useMemo(
		() =>
			totalSumEarnings > 0
				? (100 * (totalSumEarnings + totalSumExpenses)) / totalSumEarnings
				: 0,
		[totalSumEarnings, totalSumExpenses],
	);

	// Monthly bar chart data (balance = earnings - expenses)
	const monthlyData = useMemo(() => {
		const allMonths = [
			...new Set([
				...yearlyExpenses.map((e) => e.month),
				...yearlyEarnings.map((e) => e.month),
			]),
		].sort(
			(a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime(),
		);
		return allMonths.map((m) => {
			const earnings = yearlyEarnings.find((e) => e.month === m)?.total || 0;
			const expenses = yearlyExpenses.find((e) => e.month === m)?.total || 0;
			return {
				month: m.substring(0, 3),
				balance: Math.round(earnings - expenses),
			};
		});
	}, [yearlyExpenses, yearlyEarnings]);

	// Cumulative balance data (running total over months)
	const cumulativeData = useMemo(() => {
		let running = 0;
		return monthlyData.map((m) => {
			running += m.balance;
			return { month: m.month, cumulative: running };
		});
	}, [monthlyData]);

	// Best/Worst/Average month
	const monthHighlights = useMemo(() => {
		if (monthlyData.length === 0) return null;
		const best = monthlyData.reduce((a, b) => (b.balance > a.balance ? b : a));
		const worst = monthlyData.reduce((a, b) => (b.balance < a.balance ? b : a));
		const avg = Math.round(
			monthlyData.reduce((acc, m) => acc + m.balance, 0) / monthlyData.length,
		);
		return { best, worst, avg };
	}, [monthlyData]);

	// Category breakdown
	const getCategory = useCallback(
		(id: string) => categories.find((c) => c.id === id),
		[categories],
	);

	const buildCategoryData = useCallback(
		(statsList: IStats[]) => {
			const categoriesMap: Record<string, number> = {};
			const total = statsList.reduce((acc, curr) => acc + curr.total, 0);
			statsList.forEach((monthStats) => {
				monthStats.categorySummary.forEach(({ categoryId, total }) => {
					if (!categoriesMap[categoryId]) categoriesMap[categoryId] = 0;
					categoriesMap[categoryId] += total;
				});
			});
			const aggregated = Object.keys(categoriesMap)
				.map((id) => ({ category: getCategory(id), amount: categoriesMap[id] }))
				.sort((a, b) => b.amount - a.amount);
			return aggregated.map((c) => ({
				name: c.category?.name || "Unknown",
				value: c.amount,
				percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0,
				fill: c.category?.color || "#ababab",
			}));
		},
		[getCategory],
	);

	const pieExpenses = useMemo(
		() => buildCategoryData(yearlyExpenses),
		[yearlyExpenses, buildCategoryData],
	);
	const pieEarnings = useMemo(
		() => buildCategoryData(yearlyEarnings),
		[yearlyEarnings, buildCategoryData],
	);

	// Expenses grouped by tag (budget-excluded categories left out, like every other total here)
	const tagBreakdown = useMemo<TagGroup[]>(() => {
		const groups: Record<string, TagGroup> = {};
		yearExpenses
			.filter((t) => !getCategory(t.category)?.excludeFromBudget)
			.forEach((t) => {
				const key = !t.tag || t.tag === DEFAULT_TAG_ID ? UNTAGGED_KEY : t.tag;
				if (!groups[key]) {
					const tag = tags.find((tg) => tg.id === key);
					groups[key] = {
						key,
						name: key === UNTAGGED_KEY ? "No tag" : tag?.name || "Unknown",
						color: (key === UNTAGGED_KEY ? "#ababab" : tag?.color) || "#ababab",
						total: 0,
						percentage: 0,
						transactions: [],
					};
				}
				groups[key].total += t.amount;
				groups[key].transactions.push(t);
			});
		const list = Object.values(groups);
		const total = list.reduce((acc, g) => acc + g.total, 0);
		list.forEach((g) => {
			g.percentage = total > 0 ? Math.round((g.total / total) * 100) : 0;
			g.transactions.sort((a, b) => b.amount - a.amount);
		});
		return list.sort((a, b) => b.total - a.total);
	}, [yearExpenses, tags, getCategory]);

	const includedCategoriesIds = useMemo(
		() =>
			categories
				.filter(
					(c) =>
						(c.type === "earning" || c.type === "expense") &&
						!c.excludeFromBudget,
				)
				.map((c) => c.id),
		[categories],
	);

	const exportCsv = useCallback(
		(statsToExport: Stats[], filename: string) => {
			if (statsToExport.length === 0) {
				openNotificationWithIcon("warning", "Nothing to export");
				return;
			}
			downloadCsv(
				filename,
				toCsv(buildStatsCsvRows(statsToExport, categories)),
			);
		},
		[categories],
	);

	const exportYear = useCallback(() => {
		exportCsv([...yearlyExpenses, ...yearlyEarnings], `stats-${year}.csv`);
	}, [exportCsv, yearlyExpenses, yearlyEarnings, year]);

	const exportAllYears = useCallback(async () => {
		setIsLoading(true);
		try {
			const allStats = await DataBaseClient.Stats.getAllYears();
			exportCsv(allStats, "stats-all-years.csv");
		} catch (e) {
			console.log(e);
			openNotificationWithIcon("error", "Export failed");
		} finally {
			setIsLoading(false);
		}
	}, [exportCsv]);

	const freezeYear = useCallback(async () => {
		setIsLoading(true);
		try {
			const yearTransactions: Transaction[] =
				await DataBaseClient.Transaction.get({ year });
			const yearStats: IStats[] = [];
			const months = [...new Set(yearTransactions.map((t) => t.month))];
			months
				.sort(
					(a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime(),
				)
				.forEach((month) => {
					const monthTransactions = yearTransactions
						.filter((t) => t.month === month)
						.filter((t) => includedCategoriesIds.includes(t.category));
					const monthEarnings = monthTransactions.filter(
						(t) => t.type === "earning",
					);
					const monthExpenses = monthTransactions.filter(
						(t) => t.type === "expense",
					);
					const getMonthSummary = (txns: Transaction[]) => {
						const cats = [...new Set(txns.map((t) => t.category))];
						return cats.map((cat) => ({
							categoryId: cat,
							total: txns
								.filter((t) => t.category === cat)
								.reduce((acc, curr) => acc + curr.amount, 0),
						}));
					};
					yearStats.push({
						month,
						year,
						type: "earning",
						total: monthEarnings.reduce((acc, curr) => acc + curr.amount, 0),
						categorySummary: getMonthSummary(monthEarnings),
						lastUpdate: new Date().toDateString(),
					});
					yearStats.push({
						month,
						year,
						type: "expense",
						total: monthExpenses.reduce((acc, curr) => acc + curr.amount, 0),
						categorySummary: getMonthSummary(monthExpenses),
						lastUpdate: new Date().toDateString(),
					});
				});
			// Only delete stats for THIS year from Firestore
			const existingYearStats = await DataBaseClient.Stats.getByYear(year);
			if (existingYearStats.length) {
				await DataBaseClient.Stats.bulkDelete(
					existingYearStats.map((s) => s.id),
				);
			}
			// Remove this year's stats from the local store
			const store = useStatsStore.getState();
			const otherYearStats = store.stats.filter((s) => s.year !== year);
			useStatsStore.setState({ stats: otherYearStats });
			// Create new stats for this year and reload
			await DataBaseClient.Stats.bulkAdd(yearStats);
			const results = await DataBaseClient.Stats.getByYear(year);
			useStatsStore.getState().setStats(results);
		} catch (e) {
			console.log(e);
		} finally {
			setIsLoading(false);
		}
	}, [year, includedCategoriesIds]);

	const barConfig: ChartConfig = {
		balance: { label: "Balance" },
	};

	const hasData = yearlyEarnings.length > 0 || yearlyExpenses.length > 0;

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<div className="flex items-center gap-3 mb-4">
				<Link to="/family">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</Link>
				<h1 className="text-xl font-bold">Year {year}</h1>
				<div className="ml-auto flex items-center gap-2">
					<Link to="/stats/trends">
						<Button variant="ghost" size="icon" aria-label="Trends">
							<TrendingUp className="h-5 w-5" />
						</Button>
					</Link>
					<Button
						variant="ghost"
						size="icon"
						aria-label={`Export ${year} to CSV`}
						onClick={exportYear}
					>
						<Download className="h-5 w-5" />
					</Button>
					<Button size="sm" onClick={freezeYear}>
						{hasData ? "Update" : "Freeze"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-4 gap-2 mb-6">
				<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Balance</span>
					<span
						className="text-base font-bold"
						style={{ color: balance >= 0 ? "#3f8600" : "#cf1322" }}
					>
						{Math.round(balance)} €
					</span>
				</div>
				<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Earnings</span>
					<span className="text-base font-bold text-earning">
						{Math.round(totalSumEarnings)} €
					</span>
				</div>
				<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Expenses</span>
					<span className="text-base font-bold text-expense">
						{Math.round(-totalSumExpenses)} €
					</span>
				</div>
				<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Saving</span>
					<span
						className="text-base font-bold"
						style={{ color: savingRate > 0 ? "#3f8600" : "#cf1322" }}
					>
						{savingRate.toFixed(1)}%
					</span>
				</div>
			</div>

			{hasData ? (
				<>
					<YearBalanceCard
						earnings={totalSumEarnings}
						expenses={-totalSumExpenses}
						balance={balance}
					/>
					<div className="mb-6 bg-white rounded-lg shadow-sm p-4">
						<h3 className="text-sm font-semibold mb-1">Monthly Overview</h3>
						<p className="text-xs text-muted-foreground mb-3">
							Monthly balance (earnings - expenses) for {year}
						</p>
						<ChartContainer config={barConfig} className="h-[300px] w-full">
							<BarChart
								accessibilityLayer
								data={monthlyData}
								margin={{ top: 25, bottom: 10 }}
							>
								<CartesianGrid vertical={false} />
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											hideLabel
											hideIndicator
											formatter={(v) => `${v} €`}
										/>
									}
								/>
								<Bar dataKey="balance">
									<LabelList
										position="top"
										dataKey="month"
										fillOpacity={1}
										className="fill-foreground"
										fontSize={12}
									/>
									{monthlyData.map((item) => (
										<Cell
											key={item.month}
											fill={item.balance >= 0 ? "#3f8600" : "#cf1322"}
										/>
									))}
								</Bar>
							</BarChart>
						</ChartContainer>
						<p className="text-xs text-muted-foreground mt-2">
							Showing monthly balance for each month of the year
						</p>
					</div>

					{monthHighlights && (
						<div className="grid grid-cols-3 gap-2 mb-6">
							<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
								<span className="text-xs text-muted-foreground">
									Best month
								</span>
								<span className="text-sm font-bold text-earning">
									{monthHighlights.best.month}
								</span>
								<span className="text-[11px] font-mono text-muted-foreground">
									{monthHighlights.best.balance} €
								</span>
							</div>
							<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
								<span className="text-xs text-muted-foreground">
									Worst month
								</span>
								<span className="text-sm font-bold text-expense">
									{monthHighlights.worst.month}
								</span>
								<span className="text-[11px] font-mono text-muted-foreground">
									{monthHighlights.worst.balance} €
								</span>
							</div>
							<div className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm">
								<span className="text-xs text-muted-foreground">
									Avg / month
								</span>
								<span
									className="text-sm font-bold"
									style={{
										color: monthHighlights.avg >= 0 ? "#3f8600" : "#cf1322",
									}}
								>
									{monthHighlights.avg} €
								</span>
							</div>
						</div>
					)}

					{cumulativeData.length > 0 && (
						<div className="mb-6 bg-white rounded-lg shadow-sm p-4">
							<h3 className="text-sm font-semibold mb-1">Cumulative Balance</h3>
							<p className="text-xs text-muted-foreground mb-3">
								Running total of monthly balance across {year}
							</p>
							<ChartContainer
								config={{
									cumulative: { label: "Cumulative", color: "#3f8600" },
								}}
								className="h-[220px] w-full"
							>
								<AreaChart
									data={cumulativeData}
									margin={{ top: 10, right: 12, bottom: 5, left: 0 }}
								>
									<CartesianGrid strokeDasharray="3 3" vertical={false} />
									<XAxis dataKey="month" tickLine={false} axisLine={false} />
									<YAxis
										tickLine={false}
										axisLine={false}
										tickFormatter={(v) => `${v}€`}
										width={55}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent formatter={(v) => `${v} €`} />
										}
									/>
									<Area
										type="monotone"
										dataKey="cumulative"
										stroke="#3f8600"
										fill="#3f8600"
										fillOpacity={0.2}
										strokeWidth={2}
									/>
								</AreaChart>
							</ChartContainer>
						</div>
					)}

					<Tabs defaultValue="expenses">
						<TabsList className="w-full">
							<TabsTrigger value="expenses" className="flex-1">
								Expenses
							</TabsTrigger>
							<TabsTrigger value="earnings" className="flex-1">
								Earnings
							</TabsTrigger>
						</TabsList>
						<TabsContent value="expenses">
							<CategoryBreakdown data={pieExpenses} />
						</TabsContent>
						<TabsContent value="earnings">
							<CategoryBreakdown data={pieEarnings} />
						</TabsContent>
					</Tabs>

					<TagBreakdown groups={tagBreakdown} categories={categories} />
				</>
			) : (
				<div className="text-center py-12">
					<p className="text-muted-foreground mb-2">
						No data available for this year
					</p>
					<p className="text-muted-foreground mb-4">
						Freeze the year to generate stats
					</p>
					<Button onClick={freezeYear}>Freeze</Button>
				</div>
			)}

			<div className="mt-6 bg-white rounded-lg shadow-sm p-4">
				<h3 className="text-sm font-semibold mb-1">Export</h3>
				<p className="text-xs text-muted-foreground mb-3">
					Aggregated CSV: one row per month, type and category
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						onClick={exportYear}
					>
						<Download className="h-4 w-4 mr-2" />
						{year}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						onClick={exportAllYears}
					>
						<Download className="h-4 w-4 mr-2" />
						All years
					</Button>
				</div>
			</div>
		</div>
	);
}

function TagBreakdown({
	groups,
	categories,
}: {
	groups: TagGroup[];
	categories: Category[];
}) {
	const [expanded, setExpanded] = useState<string | null>(null);

	const maxTotal = groups.length ? groups[0].total : 0;

	return (
		<div className="mt-6 bg-white rounded-lg shadow-sm p-4">
			<h3 className="text-sm font-semibold mb-1">Expenses by Tag</h3>
			<p className="text-xs text-muted-foreground mb-3">
				Tap a tag to see its expenses, biggest first
			</p>
			{groups.length === 0 ? (
				<p className="text-center text-muted-foreground py-6 text-sm">
					No data
				</p>
			) : (
				<div className="space-y-2">
					{groups.map((g) => {
						const isOpen = expanded === g.key;
						return (
							<div key={g.key} className="rounded-lg overflow-hidden">
								<button
									type="button"
									onClick={() => setExpanded(isOpen ? null : g.key)}
									className="w-full text-left px-2 py-2 rounded-lg hover:bg-black/[0.03] transition-colors"
									aria-expanded={isOpen}
								>
									<div className="flex items-center gap-2 text-sm">
										<ChevronDown
											className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
												isOpen ? "" : "-rotate-90"
											}`}
										/>
										<span
											className="h-3 w-3 rounded-sm shrink-0"
											style={{ backgroundColor: g.color }}
										/>
										<span className="truncate capitalize">{g.name}</span>
										<span className="text-[11px] text-muted-foreground shrink-0">
											({g.transactions.length})
										</span>
										<div className="ml-auto flex gap-3 shrink-0">
											<span className="font-mono">{Math.round(g.total)} €</span>
											<span className="text-muted-foreground w-10 text-right">
												{g.percentage}%
											</span>
										</div>
									</div>
									<div className="mt-1.5 ml-6 h-1 rounded-full bg-black/[0.06] overflow-hidden">
										<div
											className="h-full rounded-full"
											style={{
												width: `${maxTotal > 0 ? (g.total / maxTotal) * 100 : 0}%`,
												backgroundColor: g.color,
											}}
										/>
									</div>
								</button>
								{isOpen && (
									<div className="ml-6 mt-2 mb-1 space-y-1">
										{g.transactions.map((t) => {
											const category = categories.find(
												(c) => c.id === t.category,
											);
											const categoryColor = category?.color || "#ababab";
											return (
												<div
													key={t.id}
													className="flex items-center gap-2 rounded-md px-2 py-1.5"
													style={{
														backgroundColor: `${categoryColor}10`,
														borderLeft: `3px solid ${categoryColor}`,
													}}
												>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5">
															<span className="text-[12px] font-semibold truncate capitalize">
																{category?.name || "Uncategorized"}
															</span>
														</div>
														<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
															<span className="tabular-nums shrink-0">
																{formatDate(t.date, true)}
															</span>
															{t.description && (
																<>
																	<span className="opacity-40">·</span>
																	<span className="truncate capitalize">
																		{t.description}
																	</span>
																</>
															)}
														</div>
													</div>
													<span
														className="text-[13px] font-bold tabular-nums shrink-0"
														style={{ color: `${categoryColor}cc` }}
													>
														{t.amount}
														<span className="text-[10px] font-medium ml-0.5 opacity-50">
															€
														</span>
													</span>
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

function CategoryBreakdown({
	data,
}: {
	data: { name: string; value: number; percentage: number; fill: string }[];
}) {
	if (!data.length)
		return <p className="text-center text-muted-foreground py-8">No data</p>;

	const config: ChartConfig = {};
	data.forEach((d) => {
		config[d.name] = { label: d.name, color: d.fill };
	});

	return (
		<div className="bg-white rounded-lg shadow-sm p-4 mt-2">
			<ChartContainer config={config} className="h-[250px] w-full">
				<PieChart>
					<ChartTooltip
						content={<ChartTooltipContent formatter={(v) => `${v} €`} />}
					/>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius={50}
						outerRadius={90}
						paddingAngle={2}
					>
						{data.map((entry, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Recharts Cell components require index-based keys
							<Cell key={i} fill={entry.fill} />
						))}
					</Pie>
				</PieChart>
			</ChartContainer>
			<div className="mt-4 space-y-2">
				{data.map((d) => (
					<div
						key={d.name}
						className="flex items-center justify-between text-sm"
					>
						<div className="flex items-center gap-2">
							<div
								className="h-3 w-3 rounded-sm"
								style={{ backgroundColor: d.fill }}
							/>
							<span>{d.name}</span>
						</div>
						<div className="flex gap-3">
							<span className="font-mono">{Math.round(d.value)} €</span>
							<span className="text-muted-foreground w-10 text-right">
								{d.percentage}%
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
