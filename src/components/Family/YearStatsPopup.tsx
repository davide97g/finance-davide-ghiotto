import { useMemo } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IStats } from '../../models/stats';
import YearStatsCategories from './YearStatsCategories';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	year: string;
	expenses: IStats[];
	earnings: IStats[];
	onFreeze: () => void;
}

const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: { legend: { position: 'bottom' as const } },
};

export default function YearStatsPopup({ open, onOpenChange, year, expenses, earnings, onFreeze }: Props) {
	const totalSumExpenses = useMemo(() => -1 * expenses.reduce((acc, curr) => acc + curr.total, 0), [expenses]);
	const totalSumEarnings = useMemo(() => earnings.reduce((acc, curr) => acc + curr.total, 0), [earnings]);
	const savingRate = useMemo(() => (100 * (totalSumEarnings + totalSumExpenses)) / totalSumEarnings, [totalSumEarnings, totalSumExpenses]);

	const dataMonthly = useMemo(() => {
		const months = expenses
			.map(e => e.month)
			.sort((a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime());
		return {
			labels: months,
			datasets: [
				{ label: 'Expenses', backgroundColor: '#cf1322', data: months.map(m => expenses.find(e => e.month === m)!.total) },
				{ label: 'Earnings', backgroundColor: '#3f8600', data: months.map(m => earnings.find(e => e.month === m)?.total || 0) },
			],
		};
	}, [expenses, earnings]);

	const balance = totalSumEarnings + totalSumExpenses;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Stats for {year}</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-4 gap-2 mb-4">
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Balance</span>
						<span className="text-lg font-semibold" style={{ color: balance >= 0 ? '#3f8600' : '#cf1322' }}>{Math.round(balance)} €</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Tot Earnings</span>
						<span className="text-lg font-semibold text-earning">{Math.round(totalSumEarnings)} €</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Tot Expenses</span>
						<span className="text-lg font-semibold text-expense">{Math.round(totalSumExpenses)} €</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Saving Rate</span>
						<span className="text-lg font-semibold" style={{ color: savingRate > 0 ? '#3f8600' : '#cf1322' }}>{savingRate ? savingRate.toFixed(2) : 0} %</span>
					</div>
				</div>
				{earnings.length || expenses.length ? (
					<Tabs defaultValue="1">
						<TabsList>
							<TabsTrigger value="1">Monthly Overview</TabsTrigger>
							<TabsTrigger value="2">Categories</TabsTrigger>
						</TabsList>
						<TabsContent value="1">
							<div className="h-[450px] w-full">
								<Bar data={dataMonthly} options={options} />
							</div>
						</TabsContent>
						<TabsContent value="2">
							<YearStatsCategories expenses={expenses} earnings={earnings} />
						</TabsContent>
					</Tabs>
				) : (
					<div className="text-center">
						<p>No data available for this year</p>
						<p>Would you like to freeze this year?</p>
						<Button onClick={onFreeze}>Freeze</Button>
					</div>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
					<Button onClick={onFreeze}>{expenses.length > 0 || earnings.length > 0 ? 'Update' : 'Freeze'}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
