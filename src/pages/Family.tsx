import { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Plus, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
		<div className="relative pb-14">
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
							<div ref={monthsScrollRef} className="overflow-x-auto scrollbar-hide">
								<TabsList className="inline-flex w-max h-auto">
									{MONTHS.map(month => (
										<TabsTrigger key={month} value={month}>{month.substring(0, 3)}</TabsTrigger>
									))}
								</TabsList>
							</div>
							{MONTHS.map(month => (
								<TabsContent key={month} value={month}>
									<MonthBalance month={month} year={year} />
								</TabsContent>
							))}
						</Tabs>
					</TabsContent>
				))}
				<span className="absolute top-5 right-2.5 flex items-center p-2.5 cursor-pointer" onClick={openYearStats}>
					<LineChart className="h-5 w-5" />
				</span>
			</Tabs>
			<div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-[#dde5dd] to-transparent pt-2 px-4">
				<div className="flex items-center gap-2 pb-2 max-w-md mx-auto">
					<button
						onClick={() => openPopupFor('expense')}
						className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-expense text-white font-semibold text-xs tracking-wide shadow-md shadow-expense/20 active:scale-[0.97] transition-all duration-200"
					>
						<Plus className="h-3.5 w-3.5" /> Expense
					</button>
					<button
						onClick={() => openPopupFor('earning')}
						className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-earning text-white font-semibold text-xs tracking-wide shadow-md shadow-earning/20 active:scale-[0.97] transition-all duration-200"
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
			<Settings
				className="absolute top-2.5 right-2.5 h-6 w-6 cursor-pointer"
				onClick={() => setSideMenuVisible(true)}
			/>
			<SettingsPanel open={sideMenuVisible} onOpenChange={setSideMenuVisible} />
		</div>
	);
}
