import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
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
import type { IStats } from "../models/stats";
import type { Transaction } from "../models/transaction";
import { MONTHS, setIsLoading } from "../services/utils";
import { useCategoryStore } from "../stores/category";
import { useStatsStore } from "../stores/stats";

export default function YearStats() {
	const [searchParams] = useSearchParams();
	const year = searchParams.get("year") || new Date().getFullYear().toString();

	const stats = useStatsStore((s) => s.stats);
	const categories = useCategoryStore((s) => s.categories);

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
				const results = await DataBaseClient.Stats.getByYear(year);
				useStatsStore.getState().setStats(results);
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

	// Monthly area chart data
	const monthlyData = useMemo(() => {
		const months = yearlyExpenses
			.map((e) => e.month)
			.sort(
				(a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime(),
			);
		return months.map((m) => ({
			month: m.substring(0, 3),
			expenses: yearlyExpenses.find((e) => e.month === m)?.total || 0,
			earnings: yearlyEarnings.find((e) => e.month === m)?.total || 0,
		}));
	}, [yearlyExpenses, yearlyEarnings]);

	// Category breakdown
	const getCategory = (id: string) => categories.find((c) => c.id === id);

	const buildCategoryData = (statsList: IStats[]) => {
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
	};

	const pieExpenses = useMemo(
		() => buildCategoryData(yearlyExpenses),
		[yearlyExpenses, categories],
	);
	const pieEarnings = useMemo(
		() => buildCategoryData(yearlyEarnings),
		[yearlyEarnings, categories],
	);

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

	const areaConfig: ChartConfig = {
		expenses: { label: "Expenses", color: "#cf1322" },
		earnings: { label: "Earnings", color: "#3f8600" },
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
				<div className="ml-auto">
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
					<div className="mb-6 bg-white rounded-lg shadow-sm p-4">
						<h3 className="text-sm font-semibold mb-2">Monthly Overview</h3>
						<ChartContainer config={areaConfig} className="h-[220px] w-full">
							<AreaChart data={monthlyData}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="month" tickLine={false} axisLine={false} />
								<YAxis
									tickLine={false}
									axisLine={false}
									tickFormatter={(v) => `${v}€`}
								/>
								<ChartTooltip
									content={<ChartTooltipContent formatter={(v) => `${v} €`} />}
								/>
								<Area
									type="monotone"
									dataKey="earnings"
									stroke="#3f8600"
									fill="#3f8600"
									fillOpacity={0.2}
									strokeWidth={2}
								/>
								<Area
									type="monotone"
									dataKey="expenses"
									stroke="#cf1322"
									fill="#cf1322"
									fillOpacity={0.2}
									strokeWidth={2}
								/>
							</AreaChart>
						</ChartContainer>
					</div>

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
