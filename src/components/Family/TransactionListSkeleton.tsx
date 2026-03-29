const shimmer = "animate-pulse bg-black/[0.06] rounded";

function SkeletonRow({ index }: { index: number }) {
	return (
		<div
			className={`py-2 px-2 rounded ${index % 2 === 0 ? "bg-white/40" : "bg-white/0"}`}
		>
			<div className="flex flex-col gap-2">
				{/* Row 1: description + amount */}
				<div className="flex w-full items-center">
					<div className="w-2/3">
						<div
							className={`h-4 w-[60%] ${shimmer}`}
							style={{ animationDelay: `${index * 100}ms` }}
						/>
					</div>
					<div className="w-1/3 flex justify-end">
						<div
							className={`h-5 w-16 ${shimmer}`}
							style={{ animationDelay: `${index * 100 + 50}ms` }}
						/>
					</div>
				</div>
				{/* Row 2: date + category + tag */}
				<div className="flex w-full items-center">
					<div className="w-1/5">
						<div
							className={`h-4 w-12 ${shimmer}`}
							style={{ animationDelay: `${index * 100 + 100}ms` }}
						/>
					</div>
					<div className="w-[54%]">
						<div
							className={`h-5 w-20 rounded-full ${shimmer}`}
							style={{ animationDelay: `${index * 100 + 150}ms` }}
						/>
					</div>
					<div className="w-[17%]">
						{index % 3 !== 0 && (
							<div
								className={`h-5 w-10 rounded-full ${shimmer}`}
								style={{ animationDelay: `${index * 100 + 200}ms` }}
							/>
						)}
					</div>
					<div className="w-[8%]" />
				</div>
			</div>
		</div>
	);
}

export default function TransactionListSkeleton() {
	return (
		<div className="w-full h-[calc(100dvh-260px)] overflow-hidden p-2.5 pb-14 bg-[#e2f0e2] shadow-[inset_0_0_12px_#ccc] rounded-lg">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="border-b border-black/5">
					<SkeletonRow index={i} />
				</div>
			))}
		</div>
	);
}
