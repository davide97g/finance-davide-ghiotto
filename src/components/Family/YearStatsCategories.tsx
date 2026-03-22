import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCategoryStore } from '../../stores/category';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { IStats } from '../../models/stats';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
	expenses: IStats[];
	earnings: IStats[];
}

const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: { legend: { position: 'bottom' as const } },
};

export default function YearStatsCategories({ expenses, earnings }: Props) {
	const categories = useCategoryStore(s => s.categories);
	const getCategory = (id: string) => categories.find(c => c.id === id);

	const buildData = (stats: IStats[]) => {
		const categoriesMap: Record<string, number> = {};
		const total = stats.reduce((acc, curr) => acc + curr.total, 0);
		stats.forEach(monthStats => {
			monthStats.categorySummary.forEach(({ categoryId, total }) => {
				if (!categoriesMap[categoryId]) categoriesMap[categoryId] = 0;
				categoriesMap[categoryId] += total;
			});
		});
		const aggregated = Object.keys(categoriesMap)
			.map(id => ({ category: getCategory(id)!, amount: categoriesMap[id] }))
			.sort((a, b) => b.amount - a.amount);
		return {
			labels: aggregated.map(c => (c.category?.name || '') + ' ' + Math.round((c.amount / total) * 100) + '%'),
			datasets: [{
				backgroundColor: aggregated.map(c => c.category?.color),
				data: aggregated.map(c => Math.round((c.amount / total) * 100)),
			}],
		};
	};

	const dataExpenses = useMemo(() => buildData(expenses), [expenses, categories]);
	const dataEarnings = useMemo(() => buildData(earnings), [earnings, categories]);

	return (
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
	);
}
