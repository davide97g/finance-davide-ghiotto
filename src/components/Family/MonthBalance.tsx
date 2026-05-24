import { ArrowDown, ArrowUp, Filter, LineChart, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataBaseClient } from "../../api/db";
import type { Transaction } from "../../models/transaction";
import { useCategoryStore } from "../../stores/category";
import { useTransactionStore } from "../../stores/transaction";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import FiltersPopup from "./FiltersPopup";
import TransactionList, { type Filters } from "./TransactionList";
import TransactionListSkeleton from "./TransactionListSkeleton";

interface Props {
	month: string;
	year: string;
}

export default function MonthBalance({ month, year }: Props) {
	const navigate = useNavigate();
	const [searchBarVisible, setSearchBarVisible] = useState(false);
	const [search, setSearch] = useState("");
	const [activeKey, setActiveKey] = useState("1");
	const [expenseFilters, setExpenseFilters] = useState<Filters>({});
	const [earningFilters, setEarningFilters] = useState<Filters>({});
	const [filtersPopupVisible, setFiltersPopupVisible] = useState(false);
	const [loading, setLoading] = useState(true);

	const allEarnings = useTransactionStore((s) => s.earnings);
	const allExpenses = useTransactionStore((s) => s.expenses);
	const setTransactions = useTransactionStore((s) => s.setTransactions);
	const sorting = useTransactionStore((s) => s.sorting);
	const sortTransactions = useTransactionStore((s) => s.sortTransactions);
	const categories = useCategoryStore((s) => s.categories);

	const getCategory = useCallback(
		(categoryId: string) => categories.find((c) => c.id === categoryId),
		[categories],
	);

	useEffect(() => {
		setLoading(true);
		let unsubscribe: (() => void) | undefined;
		let first = true;
		DataBaseClient.Transaction.getRT(
			(transactions: Transaction[]) => {
				setTransactions(transactions);
				if (first) {
					setLoading(false);
					first = false;
				}
			},
			{ month, year },
		).then((unsub) => {
			unsubscribe = unsub;
		});
		return () => {
			unsubscribe?.();
		};
	}, [month, year, setTransactions]);

	const earnings = useMemo(
		() => allEarnings.filter((t) => t.month === month && t.year === year),
		[allEarnings, month, year],
	);
	const expenses = useMemo(
		() => allExpenses.filter((t) => t.month === month && t.year === year),
		[allExpenses, month, year],
	);

	const totalSumExpenses = useMemo(() => {
		let tot = 0;
		expenses
			.filter((t) => !getCategory(t.category)?.excludeFromBudget)
			.forEach((t) => (tot += t.amount));
		return -tot;
	}, [expenses, getCategory]);

	const totalSumEarnings = useMemo(() => {
		let tot = 0;
		earnings
			.filter((t) => !getCategory(t.category)?.excludeFromBudget)
			.forEach((t) => (tot += t.amount));
		return tot;
	}, [earnings, getCategory]);

	const balance = totalSumEarnings + totalSumExpenses;

	const openMonthStats = () => {
		const section = activeKey === "1" ? "expenses" : "earnings";
		navigate(
			`/stats/month?month=${encodeURIComponent(month)}&year=${year}&section=${section}`,
		);
	};

	const activeFilters = activeKey === "1" ? expenseFilters : earningFilters;
	const activeFilterCount = activeFilters.categoryIds?.length || 0;

	const applyFilters = (newFilters: Filters) => {
		if (activeKey === "1") {
			setExpenseFilters(newFilters);
		} else {
			setEarningFilters(newFilters);
		}
		setFiltersPopupVisible(false);
	};

	return (
		<>
			<div className="grid grid-cols-3 gap-2 mb-4">
				<div className="flex flex-col">
					<span className="text-sm text-muted-foreground">Balance</span>
					<span
						className="text-xl font-semibold"
						style={{ color: balance >= 0 ? "#3f8600" : "#cf1322" }}
					>
						{Math.round(balance)} €
					</span>
				</div>
				<div className="flex flex-col">
					<span className="text-sm text-muted-foreground">Tot Earnings</span>
					<span className="text-xl font-semibold text-earning">
						{Math.round(totalSumEarnings)} €
					</span>
				</div>
				<div className="flex flex-col">
					<span className="text-sm text-muted-foreground">Tot Expenses</span>
					<span className="text-xl font-semibold text-expense">
						{Math.round(totalSumExpenses)} €
					</span>
				</div>
			</div>
			<Tabs value={activeKey} onValueChange={setActiveKey} className="relative">
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-1.5">
						<div className="flex items-center bg-card/60 backdrop-blur-sm rounded-full p-0.5 shadow-sm border border-border/50">
							<button
								type="button"
								onClick={() => sortTransactions(true)}
								className={`flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${
									sorting === "ascending"
										? "bg-foreground text-background shadow-md"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<ArrowUp className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={() => sortTransactions(false)}
								className={`flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${
									sorting === "descending"
										? "bg-foreground text-background shadow-md"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<ArrowDown className="h-3.5 w-3.5" />
							</button>
						</div>
						<TabsList>
							<TabsTrigger value="1">Exp</TabsTrigger>
							<TabsTrigger value="2">Earn</TabsTrigger>
						</TabsList>
					</div>
					<div className="flex items-center gap-3">
						<Search
							className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
							onClick={() => setSearchBarVisible(!searchBarVisible)}
						/>
						{/* biome-ignore lint/a11y/useSemanticElements: wrapper span with role="button" is intentional to preserve styling */}
						<span
							className="relative cursor-pointer"
							role="button"
							tabIndex={0}
							onClick={() => setFiltersPopupVisible(true)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setFiltersPopupVisible(true);
								}
							}}
						>
							<Filter className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
							{activeFilterCount > 0 && (
								<span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold shadow-sm">
									{activeFilterCount}
								</span>
							)}
						</span>
						<LineChart
							className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
							onClick={openMonthStats}
						/>
					</div>
				</div>
				<TabsContent value="1">
					{searchBarVisible && (
						<Input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search"
							className="mb-2"
						/>
					)}
					{loading ? (
						<TransactionListSkeleton />
					) : (
						<TransactionList
							type="expense"
							title="Expenses"
							transactions={expenses}
							search={search}
							filters={expenseFilters}
						/>
					)}
				</TabsContent>
				<TabsContent value="2">
					{loading ? (
						<TransactionListSkeleton />
					) : (
						<TransactionList
							type="earning"
							title="Earnings"
							transactions={earnings}
							filters={earningFilters}
						/>
					)}
				</TabsContent>
			</Tabs>
			<FiltersPopup
				type={activeKey === "1" ? "expense" : "earning"}
				open={filtersPopupVisible}
				onOpenChange={setFiltersPopupVisible}
				filters={activeFilters}
				onApply={applyFilters}
			/>
		</>
	);
}
