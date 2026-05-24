import { ArrowLeft, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { cn } from "../lib/utils";
import { MONTHS, setIsLoading } from "../services/utils";
import { useStatsStore } from "../stores/stats";

type Metric = "balance" | "earnings" | "expenses";
type ChartType = "line" | "bar";

const EARNING = "#3f8600";
const EXPENSE = "#cf1322";
const BALANCE = "#374151";

const YEAR_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function Trends() {
  const stats = useStatsStore((s) => s.stats);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const results = await DataBaseClient.Stats.getAllYears();
        useStatsStore.getState().setStats(results);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const years = useMemo(
    () => [...new Set(stats.map((s) => s.year))].sort(),
    [stats],
  );

  const yearlyTotals = useMemo(() => {
    return years.map((year) => {
      const yearStats = stats.filter((s) => s.year === year);
      const earnings = yearStats
        .filter((s) => s.type === "earning")
        .reduce((acc, s) => acc + s.total, 0);
      const expenses = yearStats
        .filter((s) => s.type === "expense")
        .reduce((acc, s) => acc + s.total, 0);
      const balance = earnings - expenses;
      return {
        year,
        earnings: Math.round(earnings),
        expenses: Math.round(expenses),
        balance: Math.round(balance),
        savingsRate: earnings > 0 ? Math.round((balance / earnings) * 1000) / 10 : 0,
      };
    });
  }, [stats, years]);

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/family">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Trends</h1>
      </div>

      <MultiYearProgression data={yearlyTotals} />
      <SavingsRateTrend data={yearlyTotals} />
      <MonthByMonthOverlay stats={stats} years={years} />
    </div>
  );
}

interface YearlyTotal {
  year: string;
  earnings: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

function ChartTypeToggle({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (v: ChartType) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("line")}
        aria-label="Line chart"
        className={cn(
          "p-1.5 transition-colors",
          value === "line"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LineChartIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("bar")}
        aria-label="Bar chart"
        className={cn(
          "p-1.5 transition-colors",
          value === "bar"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <BarChart3 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MultiYearProgression({ data }: { data: YearlyTotal[] }) {
  const [chartType, setChartType] = useState<ChartType>("line");

  const config: ChartConfig = {
    earnings: { label: "Earnings", color: EARNING },
    expenses: { label: "Expenses", color: EXPENSE },
    balance: { label: "Balance", color: BALANCE },
  };

  if (data.length === 0) {
    return (
      <EmptyCard
        title="Multi-Year Progression"
        message="Freeze a year to start the timeline."
      />
    );
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold">Multi-Year Progression</h3>
          <p className="text-xs text-muted-foreground">
            Earnings, expenses and balance across years
          </p>
        </div>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>
      <ChartContainer config={config} className="h-[280px] w-full mt-3">
        {chartType === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={55} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="earnings"
              name="Earnings"
              stroke={EARNING}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={EXPENSE}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke={BALANCE}
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={55} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="earnings" name="Earnings" fill={EARNING} radius={3} />
            <Bar dataKey="expenses" name="Expenses" fill={EXPENSE} radius={3} />
            <Bar dataKey="balance" name="Balance" fill={BALANCE} radius={3} />
          </BarChart>
        )}
      </ChartContainer>
      {data.length === 1 && (
        <p className="text-xs text-muted-foreground mt-2">One year of data so far.</p>
      )}
    </div>
  );
}

function SavingsRateTrend({ data }: { data: YearlyTotal[] }) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const config: ChartConfig = {
    savingsRate: { label: "Savings %", color: EARNING },
  };

  if (data.length === 0) {
    return <EmptyCard title="Savings Rate" message="Freeze a year to see savings rate." />;
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold">Savings Rate</h3>
          <p className="text-xs text-muted-foreground">Share of earnings kept, by year</p>
        </div>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>
      <ChartContainer config={config} className="h-[220px] w-full mt-3">
        {chartType === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={45} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
            <Line
              type="monotone"
              dataKey="savingsRate"
              name="Savings %"
              stroke={EARNING}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={45} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
            <Bar dataKey="savingsRate" name="Savings %" radius={3}>
              {data.map((d) => (
                <Cell key={d.year} fill={d.savingsRate >= 0 ? EARNING : EXPENSE} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ChartContainer>
    </div>
  );
}

interface OverlayProps {
  stats: ReturnType<typeof useStatsStore.getState>["stats"];
  years: string[];
}

function MonthByMonthOverlay({ stats, years }: OverlayProps) {
  const [metric, setMetric] = useState<Metric>("balance");
  const [chartType, setChartType] = useState<ChartType>("line");

  const data = useMemo(() => {
    return MONTHS.map((month) => {
      const row: Record<string, string | number> = { month: month.substring(0, 3) };
      years.forEach((year) => {
        const earnings =
          stats.find((s) => s.year === year && s.month === month && s.type === "earning")?.total ||
          0;
        const expenses =
          stats.find((s) => s.year === year && s.month === month && s.type === "expense")?.total ||
          0;
        let v = 0;
        if (metric === "earnings") v = earnings;
        else if (metric === "expenses") v = expenses;
        else v = earnings - expenses;
        row[year] = Math.round(v);
      });
      return row;
    });
  }, [stats, years, metric]);

  const config: ChartConfig = {};
  years.forEach((year, i) => {
    config[year] = { label: year, color: YEAR_PALETTE[i % YEAR_PALETTE.length] };
  });

  if (years.length === 0) {
    return (
      <EmptyCard
        title="Month-by-Month Comparison"
        message="Freeze a year to compare months."
      />
    );
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold">Month-by-Month Comparison</h3>
          <p className="text-xs text-muted-foreground">Same months overlaid across years</p>
        </div>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>

      <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)} className="mt-3">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="balance" className="flex-1">
            Balance
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex-1">
            Earnings
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">
            Expenses
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ChartContainer config={config} className="h-[280px] w-full">
        {chartType === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={55} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {years.map((year, i) => (
              <Line
                key={year}
                type="monotone"
                dataKey={year}
                name={year}
                stroke={YEAR_PALETTE[i % YEAR_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={55} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {years.map((year, i) => (
              <Bar
                key={year}
                dataKey={year}
                name={year}
                fill={YEAR_PALETTE[i % YEAR_PALETTE.length]}
                radius={2}
              />
            ))}
          </BarChart>
        )}
      </ChartContainer>
    </div>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground py-8 text-center">{message}</p>
    </div>
  );
}
