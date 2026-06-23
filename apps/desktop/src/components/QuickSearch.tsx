import { Input, Modal } from "@hubble.md/ui";
import { useStoreValue } from "@simplestack/store/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { basename, relativeWorkspacePath } from "../lib/filePath";
import { loadPath } from "../store/actions";
import { workspaceStore } from "../store/state";

const MAX_RESULTS = 50;

type SearchResult = {
	path: string;
	name: string;
	relative: string;
	score: number;
};

function normalize(value: string) {
	return value.toLowerCase();
}

function isSubsequence(needle: string, haystack: string) {
	let index = 0;
	for (const char of haystack) {
		if (char === needle[index]) index += 1;
		if (index === needle.length) return true;
	}
	return needle.length === 0;
}

function scoreMatch(name: string, relative: string, query: string): number {
	if (query === "") return 1;
	const n = normalize(name);
	const r = normalize(relative);
	if (n === query) return 1;
	if (n.startsWith(query)) return 0.9;
	if (n.includes(query)) return 0.8;
	if (r.includes(query)) return 0.7;
	if (isSubsequence(query, r)) return 0.4;
	return 0;
}

/**
 * Fast quick-open palette: fuzzy-search the open folder's files by name and
 * path and jump to one. Opens with Cmd/Ctrl+P.
 */
export function QuickSearch({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const workspace = useStoreValue(workspaceStore);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const listRef = useRef<HTMLDivElement | null>(null);

	const results = useMemo<SearchResult[]>(() => {
		const normalizedQuery = normalize(query.trim());
		const { files, workspacePath } = workspace;
		return files
			.map((file) => {
				const relative = relativeWorkspacePath(file.path, workspacePath);
				const name = basename(file.path);
				return {
					path: file.path,
					name,
					relative,
					score: scoreMatch(name, relative, normalizedQuery),
				};
			})
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score || a.relative.localeCompare(b.relative))
			.slice(0, MAX_RESULTS);
	}, [query, workspace]);

	useEffect(() => {
		if (open) {
			setQuery("");
			setActiveIndex(0);
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [open]);

	useEffect(() => {
		setActiveIndex(0);
	}, []);

	const activeResult = results[activeIndex];

	const openResult = (path: string) => {
		onOpenChange(false);
		void loadPath(path);
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Search notes"
			description="Jump to a file by name or path"
		>
			<div className="flex flex-col gap-2">
				<Input
					ref={inputRef}
					value={query}
					placeholder="Type to search…"
					onChange={(event) => {
						setQuery(event.target.value);
						setActiveIndex(0);
					}}
					onKeyDown={(event) => {
						if (event.key === "ArrowDown") {
							event.preventDefault();
							setActiveIndex((index) =>
								results.length === 0 ? 0 : (index + 1) % results.length,
							);
						} else if (event.key === "ArrowUp") {
							event.preventDefault();
							setActiveIndex((index) =>
								results.length === 0
									? 0
									: (index - 1 + results.length) % results.length,
							);
						} else if (event.key === "Enter") {
							event.preventDefault();
							if (activeResult) openResult(activeResult.path);
						}
					}}
				/>
				<div
					ref={listRef}
					className="flex max-h-80 flex-col gap-0.5 overflow-y-auto"
				>
					{results.length === 0 ? (
						<p className="px-2 py-3 text-center text-xs text-muted-foreground">
							{workspace.workspacePath
								? "No matching files"
								: "Open a folder to search its files"}
						</p>
					) : (
						results.map((result, index) => (
							<button
								key={result.path}
								type="button"
								data-active={index === activeIndex}
								className="flex w-full min-w-0 flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-start outline-hidden data-[active=true]:bg-accent hover:bg-accent"
								onMouseMove={() => setActiveIndex(index)}
								onClick={() => openResult(result.path)}
							>
								<span className="w-full truncate text-[13px] text-foreground">
									{result.name}
								</span>
								{result.relative !== result.name ? (
									<span className="w-full truncate text-[11px] text-muted-foreground">
										{result.relative}
									</span>
								) : null}
							</button>
						))
					)}
				</div>
			</div>
		</Modal>
	);
}
