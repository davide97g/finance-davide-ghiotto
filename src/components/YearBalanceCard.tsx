import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer } from "./ui/chart";

interface YearBalanceCardProps {
	earnings: number;
	expenses: number;
	balance: number;
}

const EARNING = "#3f8600";
const EXPENSE = "#cf1322";

export default function YearBalanceCard({
	earnings,
	expenses,
	balance,
}: YearBalanceCardProps) {
	const data = [
		{
			name: "Earnings",
			offset: 0,
			value: earnings,
			fill: EARNING,
			label: `${Math.round(earnings)} €`,
		},
		{
			name: "Expenses",
			offset: earnings - expenses,
			value: expenses,
			fill: EXPENSE,
			label: `${-Math.round(expenses)} €`,
		},
		{
			name: "Balance",
			offset: balance >= 0 ? 0 : balance,
			value: Math.abs(balance),
			fill: balance >= 0 ? EARNING : EXPENSE,
			label: `${Math.round(balance)} €`,
		},
	];

	const config: ChartConfig = {
		value: { label: "Amount" },
	};

	const minX = Math.min(0, earnings - expenses, balance);
	const maxX = Math.max(earnings, balance);
	const pad = (maxX - minX) * 0.15 || 1;

	return (
		<div className="mb-6 bg-white rounded-lg shadow-sm p-4">
			<h3 className="text-sm font-semibold mb-1">Year Balance</h3>
			<p className="text-xs text-muted-foreground mb-3">
				Earnings minus expenses equals balance
			</p>
			<ChartContainer config={config} className="h-[180px] w-full">
				<BarChart
					accessibilityLayer
					layout="vertical"
					data={data}
					margin={{ top: 5, right: 70, bottom: 5, left: 10 }}
				>
					<XAxis type="number" hide domain={[minX - pad, maxX + pad]} />
					<YAxis
						type="category"
						dataKey="name"
						tickLine={false}
						axisLine={false}
						width={70}
						fontSize={12}
					/>
					<Bar
						dataKey="offset"
						stackId="a"
						fill="transparent"
						isAnimationActive={false}
					/>
					<Bar dataKey="value" stackId="a" radius={[0, 3, 3, 0]}>
						{data.map((d) => (
							<Cell key={d.name} fill={d.fill} />
						))}
						<LabelList
							dataKey="label"
							position="right"
							fontSize={12}
							className="fill-foreground"
						/>
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
