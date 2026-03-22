import { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, Plus, LineChart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Avatar from '../components/Avatar';
import MonthBalance from '../components/Family/MonthBalance';
import NewTransactionPopup from '../components/Family/NewTransactionPopup';
import YearStatsPopup from '../components/Family/YearStatsPopup';
import SettingsPanel from '../components/Family/Settings/Settings';
import { MONTHS, YEARS, setIsLoading } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import { useStatsStore } from '../stores/stats';
import { useTagStore } from '../stores/tag';
import { DataBaseClient } from '../api/db';
import { IStats } from '../models/stats';
import { Transaction } from '../models/transaction';

export default function Family() {
	const [activeMonth, setActiveMonth] = useState(MONTHS[new Date().getMonth()]);
	const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
	const [newTransactionPopupVisible, setNewTransactionPopupVisible] = useState(false);
	const [type, setType] = useState<'expense' | 'earning'>('earning');
	const [yearStatsPopupVisible, setYearStatsPopupVisible] = useState(false);
	const [sideMenuVisible, setSideMenuVisible] = useState(false);

	const categories = useCategoryStore(s => s.categories);
	const stats = useStatsStore(s => s.stats);

	const includedCategoriesIds = useMemo(
		() =>
			categories
				.filter(c => (c.type === 'earning' || c.type === 'expense') && !c.excludeFromBudget)
				.map(c => c.id),
		[categories]
	);

	const yearlyEarnings = useMemo(
		() => stats.filter(s => s.type === 'earning' && s.year === activeYear),
		[stats, activeYear]
	);
	const yearlyExpenses = useMemo(
		() => stats.filter(s => s.type === 'expense' && s.year === activeYear),
		[stats, activeYear]
	);

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			const [cats, tags] = await Promise.all([
				DataBaseClient.Category.get(),
				DataBaseClient.Tag.get(),
			]);
			useCategoryStore.getState().setCategories(cats);
			useTagStore.getState().setTags(tags);
			setIsLoading(false);
		};
		load();
	}, []);

	const openPopupFor = (t: 'expense' | 'earning') => {
		setType(t);
		setNewTransactionPopupVisible(true);
	};

	const openPopupForYearlyStats = async () => {
		setYearStatsPopupVisible(true);
		setIsLoading(true);
		const results = await DataBaseClient.Stats.getByYear(activeYear);
		useStatsStore.getState().setStats(results);
		setIsLoading(false);
	};

	const getMonthSummaryByCategory = (transactions: Transaction[]) => {
		const cats = [...new Set(transactions.map(t => t.category))];
		return cats.map(category => {
			const catTransactions = transactions.filter(t => t.category === category);
			const total = catTransactions.reduce((acc, curr) => acc + curr.amount, 0);
			return { categoryId: category, total };
		});
	};

	const freezeYear = useCallback(async () => {
		setIsLoading(true);
		try {
			const yearTransactions: Transaction[] = await DataBaseClient.Transaction.get({
				year: activeYear,
			});
			const yearStats: IStats[] = [];
			const months = [...new Set(yearTransactions.map(t => t.month))];
			months
				.sort((a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime())
				.forEach(month => {
					const monthTransactions = yearTransactions
						.filter(t => t.month === month)
						.filter(t => includedCategoriesIds.includes(t.category));
					const monthEarnings = monthTransactions.filter(t => t.type === 'earning');
					const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
					const monthEarningsSum = monthEarnings.reduce((acc, curr) => acc + curr.amount, 0);
					const monthExpensesSum = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
					yearStats.push({
						month,
						year: activeYear,
						type: 'earning',
						total: monthEarningsSum,
						categorySummary: getMonthSummaryByCategory(monthEarnings),
						lastUpdate: new Date().toDateString(),
					});
					yearStats.push({
						month,
						year: activeYear,
						type: 'expense',
						total: monthExpensesSum,
						categorySummary: getMonthSummaryByCategory(monthExpenses),
						lastUpdate: new Date().toDateString(),
					});
				});
			const currentStats = useStatsStore.getState().stats;
			if (currentStats.length)
				await DataBaseClient.Stats.bulkDelete(currentStats.map(s => s.id));
			await DataBaseClient.Stats.bulkAdd(yearStats);
			useStatsStore.getState().reset();
		} catch (e) {
			console.log(e);
		} finally {
			setIsLoading(false);
		}
	}, [activeYear, includedCategoriesIds]);

	return (
		<div className="relative">
			<Avatar position="topLeft" />
			<h1 className="text-2xl font-bold">Family</h1>
			<Tabs value={activeYear} onValueChange={setActiveYear} className="p-2.5 h-[calc(100vh-100px)] relative">
				<TabsList className="flex-wrap h-auto">
					{YEARS.map(year => (
						<TabsTrigger key={year} value={year}>{year}</TabsTrigger>
					))}
				</TabsList>
				{YEARS.map(year => (
					<TabsContent key={year} value={year}>
						<Tabs value={activeMonth} onValueChange={setActiveMonth}>
							<TabsList className="flex-wrap h-auto">
								{MONTHS.map(month => (
									<TabsTrigger key={month} value={month}>{month.substring(0, 3)}</TabsTrigger>
								))}
							</TabsList>
							{MONTHS.map(month => (
								<TabsContent key={month} value={month}>
									<MonthBalance month={month} year={year} />
								</TabsContent>
							))}
						</Tabs>
					</TabsContent>
				))}
				<span className="absolute top-5 right-2.5 flex items-center p-2.5 cursor-pointer" onClick={openPopupForYearlyStats}>
					<LineChart className="h-5 w-5" />
				</span>
			</Tabs>
			<div className="flex items-center justify-around">
				<Button
					onClick={() => openPopupFor('expense')}
					className="bg-expense hover:bg-expense/90"
				>
					<Plus className="mr-1 h-4 w-4" /> Exp
				</Button>
				<Button
					onClick={() => openPopupFor('earning')}
					className="bg-earning hover:bg-earning/90 ml-1"
				>
					<Plus className="mr-1 h-4 w-4" /> Earn
				</Button>
			</div>
			<NewTransactionPopup
				open={newTransactionPopupVisible}
				onOpenChange={setNewTransactionPopupVisible}
				type={type}
			/>
			<YearStatsPopup
				open={yearStatsPopupVisible}
				onOpenChange={setYearStatsPopupVisible}
				year={activeYear}
				earnings={yearlyEarnings}
				expenses={yearlyExpenses}
				onFreeze={freezeYear}
			/>
			<Settings
				className="absolute top-2.5 right-2.5 h-6 w-6 cursor-pointer"
				onClick={() => setSideMenuVisible(true)}
			/>
			<SettingsPanel open={sideMenuVisible} onOpenChange={setSideMenuVisible} />
		</div>
	);
}
