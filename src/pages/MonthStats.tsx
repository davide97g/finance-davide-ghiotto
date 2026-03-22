import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { useCategoryStore } from '../stores/category';
import { DataBaseClient } from '../api/db';
import { Transaction } from '../models/transaction';
import { Category } from '../models/category';
import { MONTHS, setIsLoading } from '../services/utils';

function buildCategoryData(transactions: Transaction[], allCategories: Category[], categories: Category[]) {
	const getCategory = (id: string) => categories.find(c => c.id === id);
	const categoriesMap: Record<string, { amount: number; category?: Category }> = {};
	transactions
		.filter(t => !getCategory(t.category)?.excludeFromBudget)
		.forEach(t => {
			if (!categoriesMap[t.category]) categoriesMap[t.category] = { amount: 0 };
			categoriesMap[t.category].amount += t.amount;
		});
	const aggregated = Object.keys(categoriesMap).map(c => ({
		...categoriesMap[c],
		category: allCategories.find(cat => cat.id === c),
	}));
	const total = aggregated.reduce((acc, c) => acc + c.amount, 0);
	aggregated.sort((a, b) => b.amount - a.amount);
	return aggregated.map(c => ({
		name: c.category?.name || 'Unknown',
		value: c.amount,
		percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0,
		fill: c.category?.color || '#ababab',
	}));
}

export default function MonthStats() {
	const [searchParams] = useSearchParams();
	const month = searchParams.get('month') || MONTHS[new Date().getMonth()];
	const year = searchParams.get('year') || new Date().getFullYear().toString();
	const section = searchParams.get('section') || 'expenses';

	const [expenses, setExpenses] = useState<Transaction[]>([]);
	const [earnings, setEarnings] = useState<Transaction[]>([]);
	const allCategories = useCategoryStore(s => s.categories);

	// Fetch transactions and categories directly from Firestore
	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				// Ensure categories are loaded
				if (useCategoryStore.getState().categories.length === 0) {
					const cats = await DataBaseClient.Category.get();
					useCategoryStore.getState().setCategories(cats);
				}
				const [exp, earn] = await Promise.all([
					DataBaseClient.Transaction.get({ type: 'expense', month, year }),
					DataBaseClient.Transaction.get({ type: 'earning', month, year }),
				]);
				setExpenses(exp);
				setEarnings(earn);
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [month, year]);

	const categories = useMemo(
		() => allCategories.filter(c => c.type === 'earning' || c.type === 'expense'),
		[allCategories]
	);
	const getCategory = (id: string) => categories.find(c => c.id === id);

	const totalExpenses = useMemo(() => {
		let tot = 0;
		expenses.filter(t => !getCategory(t.category)?.excludeFromBudget).forEach(t => (tot += t.amount));
		return tot;
	}, [expenses, categories]);

	const totalEarnings = useMemo(() => {
		let tot = 0;
		earnings.filter(t => !getCategory(t.category)?.excludeFromBudget).forEach(t => (tot += t.amount));
		return tot;
	}, [earnings, categories]);

	const balance = totalEarnings - totalExpenses;

	const pieExpenses = useMemo(() => buildCategoryData(expenses, allCategories, categories), [expenses, allCategories, categories]);
	const pieEarnings = useMemo(() => buildCategoryData(earnings, allCategories, categories), [earnings, allCategories, categories]);

	// Daily trend data for area chart
	const dailyData = useMemo(() => {
		const daysMap: Record<string, { day: string; expenses: number; earnings: number }> = {};
		const all = [...expenses, ...earnings].filter(t => !getCategory(t.category)?.excludeFromBudget);
		all.forEach(t => {
			const day = new Date(t.date).getDate().toString();
			if (!daysMap[day]) daysMap[day] = { day, expenses: 0, earnings: 0 };
			if (t.type === 'expense') daysMap[day].expenses += t.amount;
			else daysMap[day].earnings += t.amount;
		});
		return Object.values(daysMap).sort((a, b) => parseInt(a.day) - parseInt(b.day));
	}, [expenses, earnings, categories]);

	const areaConfig: ChartConfig = {
		expenses: { label: 'Expenses', color: '#cf1322' },
		earnings: { label: 'Earnings', color: '#3f8600' },
	};

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<div className="flex items-center gap-3 mb-4">
				<Link to="/family">
					<Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
				</Link>
				<h1 className="text-xl font-bold">{month} {year}</h1>
			</div>

			<div className="grid grid-cols-3 gap-2 mb-6">
				<div className="flex flex-col items-center p-3 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Balance</span>
					<span className="text-lg font-bold" style={{ color: balance >= 0 ? '#3f8600' : '#cf1322' }}>
						{Math.round(balance)} €
					</span>
				</div>
				<div className="flex flex-col items-center p-3 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Earnings</span>
					<span className="text-lg font-bold text-earning">{Math.round(totalEarnings)} €</span>
				</div>
				<div className="flex flex-col items-center p-3 rounded-lg bg-white shadow-sm">
					<span className="text-xs text-muted-foreground">Expenses</span>
					<span className="text-lg font-bold text-expense">{Math.round(totalExpenses)} €</span>
				</div>
			</div>

			{dailyData.length > 0 && (
				<div className="mb-6 bg-white rounded-lg shadow-sm p-4">
					<h3 className="text-sm font-semibold mb-2">Daily Trend</h3>
					<ChartContainer config={areaConfig} className="h-[200px] w-full">
						<AreaChart data={dailyData}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="day" tickLine={false} axisLine={false} />
							<YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
							<ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
							<Area type="monotone" dataKey="earnings" stroke="#3f8600" fill="#3f8600" fillOpacity={0.2} strokeWidth={2} />
							<Area type="monotone" dataKey="expenses" stroke="#cf1322" fill="#cf1322" fillOpacity={0.2} strokeWidth={2} />
						</AreaChart>
					</ChartContainer>
				</div>
			)}

			<Tabs defaultValue={section}>
				<TabsList className="w-full">
					<TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
					<TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
				</TabsList>
				<TabsContent value="expenses">
					<CategoryBreakdown data={pieExpenses} />
				</TabsContent>
				<TabsContent value="earnings">
					<CategoryBreakdown data={pieEarnings} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function CategoryBreakdown({ data }: { data: { name: string; value: number; percentage: number; fill: string }[] }) {
	if (!data.length) return <p className="text-center text-muted-foreground py-8">No data</p>;

	const config: ChartConfig = {};
	data.forEach(d => { config[d.name] = { label: d.name, color: d.fill }; });

	return (
		<div className="bg-white rounded-lg shadow-sm p-4 mt-2">
			<ChartContainer config={config} className="h-[250px] w-full">
				<PieChart>
					<ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
					<Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
						{data.map((entry, i) => (
							<Cell key={i} fill={entry.fill} />
						))}
					</Pie>
				</PieChart>
			</ChartContainer>
			<div className="mt-4 space-y-2">
				{data.map(d => (
					<div key={d.name} className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<div className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.fill }} />
							<span>{d.name}</span>
						</div>
						<div className="flex gap-3">
							<span className="font-mono">{Math.round(d.value)} €</span>
							<span className="text-muted-foreground w-10 text-right">{d.percentage}%</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
