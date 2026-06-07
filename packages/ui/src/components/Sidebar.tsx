import { Select } from "@base-ui/react/select";
import { useCallback, useEffect, useRef, useState } from "react";
import MingcuteAzSortAscendingLettersLine from "~icons/mingcute/az-sort-ascending-letters-line";
import MingcuteCheckLine from "~icons/mingcute/check-line";
import MingcuteRightLine from "~icons/mingcute/right-line";
import MingcuteSortDescendingLine from "~icons/mingcute/sort-descending-line";
import { shouldShowFooterDivider } from "../lib/scrollOverflow";
import { cn } from "../lib/utils";
import { Button } from "../primitives/button";
import { useSidebarKeyboardNav } from "./useSidebarKeyboardNav";
import {
	type SidebarFile,
	type SidebarRow,
	type SidebarSortMode,
	useSidebarTree,
} from "./useSidebarTree";

export type { SidebarFile, SidebarSortMode };

export function Sidebar({
	files,
	currentPath,
	pendingPath,
	sortMode,
	storageScope,
	header,
	footer,
	emptyState,
	getDisplayPath = (path) => path,
	onSortModeChange,
	onSelectFile,
}: {
	files: SidebarFile[];
	currentPath: string | null;
	pendingPath?: string | null;
	sortMode: SidebarSortMode;
	/** Stable key used to persist folder expansion for one workspace/open folder. */
	storageScope?: string | null;
	header?: React.ReactNode;
	footer?: React.ReactNode;
	emptyState?: React.ReactNode;
	getDisplayPath?: (path: string) => string;
	onSortModeChange: (mode: SidebarSortMode) => void;
	onSelectFile: (path: string) => void;
}) {
	const navRef = useRef<HTMLDivElement>(null);
	const [showFooterDivider, setShowFooterDivider] = useState(false);
	const highlightPath = pendingPath ?? currentPath;
	const { collapseFolder, expandFolder, rows, toggleFolder } = useSidebarTree({
		files,
		getDisplayPath,
		highlightPath,
		sortMode,
		storageScope,
	});
	const activateRow = useCallback(
		(row: SidebarRow) => {
			if (row.kind === "file") onSelectFile(row.file.path);
			else toggleFolder(row.id);
		},
		[onSelectFile, toggleFolder],
	);
	const expandRow = useCallback(
		(row: SidebarRow) => {
			if (row.kind === "folder") expandFolder(row.id);
		},
		[expandFolder],
	);
	const collapseRow = useCallback(
		(row: SidebarRow) => {
			if (row.kind === "folder") collapseFolder(row.id);
		},
		[collapseFolder],
	);
	const activeIndex = rows.findIndex(
		(row) => row.kind === "file" && row.file.path === highlightPath,
	);
	const { focusedIndex, setFocusedIndex, onKeyDown } = useSidebarKeyboardNav({
		items: rows,
		onSelect: activateRow,
		onExpand: expandRow,
		onCollapse: collapseRow,
		navRef,
		activeIndex,
	});

	useEffect(() => {
		if (highlightPath || rows.length === 0 || focusedIndex !== null) return;
		setFocusedIndex(0);
	}, [focusedIndex, highlightPath, rows.length, setFocusedIndex]);

	const updateFooterDivider = useCallback(() => {
		const nav = navRef.current;
		if (!nav || !footer) {
			setShowFooterDivider(false);
			return;
		}
		setShowFooterDivider(shouldShowFooterDivider(nav));
	}, [footer]);

	useEffect(() => {
		const nav = navRef.current;
		if (!nav || !footer) {
			updateFooterDivider();
			return;
		}

		updateFooterDivider();
		requestAnimationFrame(updateFooterDivider);
		const resizeObserver = new ResizeObserver(updateFooterDivider);
		const mutationObserver = new MutationObserver(updateFooterDivider);
		resizeObserver.observe(nav);
		mutationObserver.observe(nav, { childList: true, subtree: true });
		nav.addEventListener("scroll", updateFooterDivider, { passive: true });
		window.addEventListener("resize", updateFooterDivider);
		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			nav.removeEventListener("scroll", updateFooterDivider);
			window.removeEventListener("resize", updateFooterDivider);
		};
	}, [footer, updateFooterDivider]);

	const footerDividerClass = showFooterDivider
		? "[border-block-start:1px_dashed_var(--border)]"
		: "[border-block-start:1px_solid_transparent]";

	return (
		<aside className="flex w-[220px] shrink-0 flex-col overflow-hidden border-e border-sidebar-border bg-sidebar">
			<div className="flex items-center justify-between border-b border-sidebar-border px-2.5 py-1.5">
				{header ?? (
					<span className="text-[11px] font-medium uppercase text-muted-foreground">
						Files
					</span>
				)}
				<Select.Root
					value={sortMode}
					onValueChange={(mode) => {
						if (mode) onSortModeChange(mode);
					}}
				>
					<Select.Trigger
						render={
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label="Sort by..."
								title="Sort by..."
							/>
						}
					>
						{sortMode === "alpha" ? (
							<MingcuteAzSortAscendingLettersLine className="size-3.5" />
						) : (
							<MingcuteSortDescendingLine className="size-3.5" />
						)}
					</Select.Trigger>
					<Select.Portal>
						<Select.Positioner align="end" side="bottom" sideOffset={4}>
							<Select.Popup className="z-50 w-36 origin-(--transform-origin) rounded-sm border border-border bg-popover p-1 text-[11px] text-popover-foreground shadow-panel inset-shadow-chrome outline-hidden transition-[transform,opacity] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
								<p className="px-2 py-1 text-[10px] font-medium text-muted-foreground">
									Sort by
								</p>
								<SortOption value="recent" label="Recent" />
								<SortOption value="alpha" label="Name" />
							</Select.Popup>
						</Select.Positioner>
					</Select.Portal>
				</Select.Root>
			</div>
			<div
				ref={navRef}
				role="tree"
				className="flex-1 overflow-y-auto overscroll-contain py-1 outline-none"
				tabIndex={0}
				onKeyDown={onKeyDown}
				data-sidebar-nav
			>
				{rows.length === 0 && emptyState}
				{rows.map((row, index) => {
					const isActive =
						row.kind === "file" && row.file.path === highlightPath;
					const isFocused = focusedIndex === index;
					return (
						<button
							key={row.kind === "folder" ? row.id : row.file.path}
							type="button"
							role="treeitem"
							data-sidebar-index={index}
							aria-expanded={row.kind === "folder" ? row.expanded : undefined}
							aria-selected={isActive}
							className={cn(
								"flex w-full items-center gap-1 truncate border-none bg-transparent [padding-block:0.25rem] [padding-inline-end:0.5rem] text-start text-[13px] text-sidebar-foreground hover:bg-sidebar-accent",
								isActive &&
									"bg-sidebar-accent text-sidebar-accent-foreground font-medium",
								isFocused && "bg-sidebar-accent",
							)}
							style={
								{
									paddingInlineStart: `${0.5 + row.depth * 0.75}rem`,
								} as React.CSSProperties
							}
							onClick={() => {
								activateRow(row);
								requestAnimationFrame(() => navRef.current?.focus());
							}}
							onPointerEnter={() => setFocusedIndex(index)}
							onPointerLeave={() => setFocusedIndex(null)}
							title={row.label}
						>
							<span className="inline-flex size-3 shrink-0 items-center justify-center text-muted-foreground">
								{row.kind === "folder" && (
									<MingcuteRightLine
										className={cn(
											"size-3 transition-transform duration-150 ease-out",
											row.expanded && "rotate-90",
										)}
									/>
								)}
							</span>
							<span className="truncate">{row.label}</span>
						</button>
					);
				})}
			</div>
			{footer && <div className={footerDividerClass}>{footer}</div>}
		</aside>
	);
}

function SortOption({ value, label }: { value: string; label: string }) {
	return (
		<Select.Item
			value={value}
			className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-start text-[11px] text-foreground outline-hidden select-none data-highlighted:bg-accent"
		>
			<Select.ItemIndicator className="inline-flex" keepMounted>
				<MingcuteCheckLine className="size-3 [[data-selected]_&]:opacity-100 opacity-0" />
			</Select.ItemIndicator>
			<Select.ItemText>{label}</Select.ItemText>
		</Select.Item>
	);
}
