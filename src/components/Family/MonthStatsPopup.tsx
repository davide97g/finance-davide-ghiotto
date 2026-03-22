import { useMemo } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useCategoryStore } from '../../stores/category';
import { Transaction } from '../../models/transaction';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Category } from '../../models/category';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	month: string;
	year: string;
	expenses: Transaction[];
	earnings: Transaction[];
}

function buildChartData(transactions: Transaction[], allCategories: Category[], categories: Category[]) {
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
	return {
		labels: aggregated.map(c => (c.category?.name || '') + ' ' + Math.round((c.amount / total) * 100) + '%'),
		datasets: [{
			backgroundColor: aggregated.map(c => c.category?.color),
			data: aggregated.map(c => Math.round((c.amount / total) * 100)),
		}],
	};
}

const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: { legend: { position: 'bottom' as const } },
};

export default function MonthStatsPopup({ open, onOpenChange, month, year, expenses, earnings }: Props) {
	const allCategories = useCategoryStore(s => s.categories);
	const categories = useMemo(() => allCategories.filter(c => c.type === 'earning' || c.type === 'expense'), [allCategories]);

	const dataExpenses = useMemo(() => buildChartData(expenses, allCategories, categories), [expenses, allCategories, categories]);
	const dataEarnings = useMemo(() => buildChartData(earnings, allCategories, categories), [earnings, allCategories, categories]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Statistic for {month} {year}</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue="1">
					<TabsList>
						<TabsTrigger value="1">Expenses</TabsTrigger>
						<TabsTrigger value="2">Earnings</TabsTrigger>
					</TabsList>
					<TabsContent value="1">
						<div className="h-[450px] w-full">
							<Doughnut data={dataExpenses} options={options} />
						</div>
					</TabsContent>
					<TabsContent value="2">
						<div className="h-[450px] w-full">
							<Doughnut data={dataEarnings} options={options} />
						</div>
					</TabsContent>
				</Tabs>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
