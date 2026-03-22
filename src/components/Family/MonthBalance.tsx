import { useEffect, useMemo, useState } from 'react';
import { LineChart, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import TransactionList from './TransactionList';
import MonthStatsPopup from './MonthStatsPopup';
import { DataBaseClient } from '../../api/db';
import { useTransactionStore } from '../../stores/transaction';
import { useCategoryStore } from '../../stores/category';
import { Transaction } from '../../models/transaction';

interface Props {
	month: string;
	year: string;
}

export default function MonthBalance({ month, year }: Props) {
	const [statsPopupVisible, setStatsPopupVisible] = useState(false);
	const [searchBarVisible, setSearchBarVisible] = useState(false);
	const [search, setSearch] = useState('');
	const [activeKey, setActiveKey] = useState('1');

	const allEarnings = useTransactionStore(s => s.earnings);
	const allExpenses = useTransactionStore(s => s.expenses);
	const setTransactions = useTransactionStore(s => s.setTransactions);
	const categories = useCategoryStore(s => s.categories);

	const getCategory = (categoryId: string) => categories.find(c => c.id === categoryId);

	useEffect(() => {
		let unsubscribe: (() => void) | undefined;
		DataBaseClient.Transaction.getRT(
			(transactions: Transaction[]) => setTransactions(transactions),
			{ month, year }
		).then(unsub => {
			unsubscribe = unsub;
		});
		return () => {
			unsubscribe?.();
		};
	}, [month, year]);

	const earnings = useMemo(
		() => allEarnings.filter(t => t.month === month && t.year === year),
		[allEarnings, month, year]
	);
	const expenses = useMemo(
		() => allExpenses.filter(t => t.month === month && t.year === year),
		[allExpenses, month, year]
	);

	const totalSumExpenses = useMemo(() => {
		let tot = 0;
		expenses.filter(t => !getCategory(t.category)?.excludeFromBudget).forEach(t => (tot += t.amount));
		return -tot;
	}, [expenses, categories]);

	const totalSumEarnings = useMemo(() => {
		let tot = 0;
		earnings.filter(t => !getCategory(t.category)?.excludeFromBudget).forEach(t => (tot += t.amount));
		return tot;
	}, [earnings, categories]);

	const balance = totalSumEarnings + totalSumExpenses;

	return (
		<>
			<div className="grid grid-cols-3 gap-2 mb-4">
				<div className="flex flex-col">
					<span className="text-sm text-muted-foreground">Balance</span>
					<span className="text-xl font-semibold" style={{ color: balance >= 0 ? '#3f8600' : '#cf1322' }}>
						{Math.round(balance)} €
					</span>
				</div>
				<div className="flex flex-col">
					<span className="text-sm text-muted-foreground">Tot Earnings</span>
					<span className="text-xl font-semibold text-earning">{Math.round(totalSumEarnings)} €</span>
				</div>
				<div className="flex flex-col">
					<span className="text-sm text-muted-foreground">Tot Expenses</span>
					<span className="text-xl font-semibold text-expense">{Math.round(totalSumExpenses)} €</span>
				</div>
			</div>
			<Tabs value={activeKey} onValueChange={setActiveKey} className="relative">
				<TabsList>
					<TabsTrigger value="1">Expenses</TabsTrigger>
					<TabsTrigger value="2">Earnings</TabsTrigger>
				</TabsList>
				<TabsContent value="1">
					{searchBarVisible && (
						<Input
							type="text"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Search"
							className="mb-2"
						/>
					)}
					<TransactionList type="expense" title="Expenses" transactions={expenses} search={search} />
				</TabsContent>
				<TabsContent value="2">
					<TransactionList type="earning" title="Earnings" transactions={earnings} />
				</TabsContent>
				{(earnings.length > 0 || expenses.length > 0) && (
					<span className="absolute right-0 top-0 p-2.5 h-[46px] flex items-center gap-4">
						<Search className="h-4 w-4 cursor-pointer" onClick={() => setSearchBarVisible(!searchBarVisible)} />
						<LineChart className="h-4 w-4 cursor-pointer" onClick={() => setStatsPopupVisible(true)} />
					</span>
				)}
			</Tabs>
			<MonthStatsPopup
				open={statsPopupVisible}
				onOpenChange={setStatsPopupVisible}
				month={month}
				year={year}
				expenses={expenses}
				earnings={earnings}
			/>
		</>
	);
}
