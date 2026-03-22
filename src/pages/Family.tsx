import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Plus, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Avatar from '../components/Avatar';
import MonthBalance from '../components/Family/MonthBalance';
import NewTransactionPopup from '../components/Family/NewTransactionPopup';
import SettingsPanel from '../components/Family/Settings/Settings';
import { MONTHS, YEARS, setIsLoading } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import { useTagStore } from '../stores/tag';
import { DataBaseClient } from '../api/db';

export default function Family() {
	const navigate = useNavigate();
	const [activeMonth, setActiveMonth] = useState(MONTHS[new Date().getMonth()]);
	const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
	const [newTransactionPopupVisible, setNewTransactionPopupVisible] = useState(false);
	const [type, setType] = useState<'expense' | 'earning'>('earning');
	const [sideMenuVisible, setSideMenuVisible] = useState(false);
	const monthsScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = monthsScrollRef.current;
		if (!container) return;
		const activeEl = container.querySelector('[data-state="active"]') as HTMLElement;
		if (activeEl) {
			activeEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
		}
	}, [activeMonth, activeYear]);

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

	const openYearStats = () => {
		navigate(`/stats/year?year=${activeYear}`);
	};

	return (
		<div className="relative">
			{/* Top bar */}
			<div className="flex items-center gap-2.5 px-3 py-2.5">
				<Avatar className="shrink-0" />
				<Select value={activeYear} onValueChange={setActiveYear}>
					<SelectTrigger className="w-[90px] h-8 font-semibold text-sm border-none bg-white/60 backdrop-blur-sm shadow-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{YEARS.map(year => (
							<SelectItem key={year} value={year}>{year}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="ml-auto flex items-center gap-2.5">
					<LineChart className="h-[18px] w-[18px] cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={openYearStats} />
					<SettingsIcon className="h-[18px] w-[18px] cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSideMenuVisible(true)} />
				</div>
			</div>

			{/* Month tabs + content */}
			<div className="px-2.5">
				<Tabs value={activeMonth} onValueChange={setActiveMonth}>
					<div ref={monthsScrollRef} className="overflow-x-auto scrollbar-hide -mx-2.5 px-2.5">
						<TabsList className="inline-flex w-max h-auto gap-1 bg-transparent p-0">
							{MONTHS.map(month => (
								<TabsTrigger
									key={month}
									value={month}
									className="rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide data-[state=active]:bg-foreground data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground bg-transparent"
								>
									{month.substring(0, 3)}
								</TabsTrigger>
							))}
						</TabsList>
					</div>
					{MONTHS.map(month => (
						<TabsContent key={month} value={month}>
							<MonthBalance month={month} year={activeYear} />
						</TabsContent>
					))}
				</Tabs>
			</div>

			{/* Footer buttons */}
			<div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-[#dde5dd] to-transparent pt-2 px-4">
				<div className="flex items-center gap-2 pb-2 max-w-md mx-auto">
					<button
						onClick={() => openPopupFor('expense')}
						className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-expense text-white font-semibold text-xs tracking-wide shadow-md shadow-expense/20 active:scale-[0.97] transition-all duration-200"
					>
						<Plus className="h-3.5 w-3.5" /> Expense
					</button>
					<button
						onClick={() => openPopupFor('earning')}
						className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-earning text-white font-semibold text-xs tracking-wide shadow-md shadow-earning/20 active:scale-[0.97] transition-all duration-200"
					>
						<Plus className="h-3.5 w-3.5" /> Earning
					</button>
				</div>
			</div>

			<NewTransactionPopup
				open={newTransactionPopupVisible}
				onOpenChange={setNewTransactionPopupVisible}
				type={type}
			/>
			<SettingsPanel open={sideMenuVisible} onOpenChange={setSideMenuVisible} />
		</div>
	);
}
