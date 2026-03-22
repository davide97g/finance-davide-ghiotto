import * as React from 'react';
import { ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '../../lib/utils';

export type ChartConfig = Record<
	string,
	{
		label?: string;
		color?: string;
	}
>;

type ChartContextProps = {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error('useChart must be used within a <ChartContainer />');
	}
	return context;
}

export const ChartContainer = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & { config: ChartConfig }
>(({ id, className, children, config, ...props }, ref) => {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-chart={chartId}
				ref={ref}
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
					className
				)}
				{...props}
			>
				<style>{`
[data-chart="${chartId}"] {
${Object.entries(config)
	.map(([key, value]) => `  --color-${key}: ${value.color};`)
	.join('\n')}
}
`}</style>
				<ResponsiveContainer width="100%" height="100%">
					{children as React.ReactElement}
				</ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
});
ChartContainer.displayName = 'ChartContainer';

export const ChartTooltipContent = React.forwardRef<
	HTMLDivElement,
	{
		active?: boolean;
		payload?: any[];
		label?: string;
		hideLabel?: boolean;
		hideIndicator?: boolean;
		indicator?: 'line' | 'dot' | 'dashed';
		labelFormatter?: (label: string, payload: any[]) => React.ReactNode;
		formatter?: (value: number, name: string, item: any, index: number, payload: any) => React.ReactNode;
		className?: string;
	}
>(({ active, payload, label, hideLabel, formatter, labelFormatter, className }, ref) => {
	if (!active || !payload?.length) return null;

	return (
		<div
			ref={ref}
			className={cn(
				'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-xs shadow-xl',
				className
			)}
		>
			{!hideLabel && (
				<div className="font-medium">
					{labelFormatter ? labelFormatter(label || '', payload || []) : label}
				</div>
			)}
			<div className="grid gap-1.5">
				{payload.map((item: any, index: number) => (
					<div key={item.dataKey || index} className="flex items-center gap-2">
						<div
							className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
							style={{ backgroundColor: item.color }}
						/>
						<div className="flex flex-1 justify-between gap-4">
							<span className="text-muted-foreground">{item.name}</span>
							<span className="font-mono font-medium tabular-nums">
								{formatter
									? formatter(item.value, item.name, item, index, item.payload)
									: item.value}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
});
ChartTooltipContent.displayName = 'ChartTooltipContent';

export { RechartsTooltip as ChartTooltip };
