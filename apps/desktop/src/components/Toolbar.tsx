import { Menu } from "@base-ui/react/menu";
import { Button, Toolbar as SharedToolbar } from "@hubble.md/ui";
import { useStoreValue } from "@simplestack/store/react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import MingcuteCopy2Line from "~icons/mingcute/copy-2-line";
import MingcuteEarthLine from "~icons/mingcute/earth-line";
import MingcuteFolderOpenLine from "~icons/mingcute/folder-open-line";
import MingcuteMore2Line from "~icons/mingcute/more-2-line";
import MingcuteTerminalAiLine from "~icons/mingcute/terminal-ai-line";
import { desktopApi } from "../desktopApi";
import { relativeWorkspacePath } from "../lib/filePath";
import { findLanguageVariants } from "../lib/languageVariants";
import { revealFileLabel } from "../lib/revealFile";
import {
	loadPath,
	renameCurrentMarkdownFile,
	startClaude,
	toggleSidebar,
} from "../store/actions";
import {
	currentPathStore,
	sidebarOpenStore,
	workspacePathStore,
	workspaceStore,
} from "../store/state";

const dragRegionStyle = {
	WebkitAppRegion: "drag",
} as CSSProperties;

export function Toolbar({
	scrollContainer,
	showSidebarBadge = false,
}: {
	scrollContainer: HTMLDivElement | null;
	showSidebarBadge?: boolean;
}) {
	const workspacePath = useStoreValue(workspacePathStore);
	const sidebarOpen = useStoreValue(sidebarOpenStore);
	const currentPath = useStoreValue(currentPathStore);

	return (
		<SharedToolbar
			currentPath={currentPath ?? null}
			sidebarOpen={sidebarOpen}
			sidebarBadge={showSidebarBadge}
			scrollContainer={scrollContainer}
			rootProps={{ style: dragRegionStyle }}
			onToggleSidebar={toggleSidebar}
			onRenameCurrentPath={(nextName) =>
				void renameCurrentMarkdownFile(nextName)
			}
			rightSlot={
				workspacePath ? (
					<div className="flex items-center gap-1">
						{currentPath ? (
							<LanguageSwitcher currentPath={currentPath} />
						) : null}
						<StartClaudeButton />
						{currentPath ? <NoteActionsMenu path={currentPath} /> : null}
					</div>
				) : undefined
			}
		/>
	);
}

function LanguageSwitcher({ currentPath }: { currentPath: string }) {
	const workspace = useStoreValue(workspaceStore);
	const { files, workspacePath } = workspace;
	const currentRel = relativeWorkspacePath(currentPath, workspacePath);
	const relPaths = files.map((file) =>
		relativeWorkspacePath(file.path, workspacePath),
	);
	const variants = findLanguageVariants(currentRel, relPaths);
	if (!variants) return null;

	const absByRel = new Map(
		files.map((file) => [
			relativeWorkspacePath(file.path, workspacePath),
			file.path,
		]),
	);
	const currentLabel =
		variants.variants.find((variant) => variant.lang === variants.current)
			?.lang ?? variants.current;

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						variant="ghost"
						size="sm"
						aria-label="Switch language"
						title="Switch language"
						className="gap-1 px-2"
					/>
				}
			>
				<MingcuteEarthLine className="size-4" />
				<span className="text-[11px] uppercase">{currentLabel}</span>
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner align="end" side="bottom" sideOffset={4}>
					<Menu.Popup className="z-50 w-44 origin-(--transform-origin) rounded-sm border border-border bg-popover p-1 text-[11px] text-popover-foreground outline-hidden transition-[transform,opacity] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
						{variants.variants.map((variant) => {
							const target = absByRel.get(variant.relPath);
							const isCurrent = variant.lang === variants.current;
							return (
								<Menu.Item
									key={variant.lang}
									disabled={!target || isCurrent}
									className="flex w-full cursor-pointer items-center gap-2 rounded-sm [padding-block:0.375rem] [padding-inline:0.5rem] text-start text-[11px] outline-hidden select-none data-disabled:opacity-60 data-highlighted:bg-accent"
									onClick={() => {
										if (target && !isCurrent) void loadPath(target);
									}}
								>
									<span className="min-w-0 flex-1">{variant.label}</span>
									<span className="shrink-0 text-[10px] uppercase text-muted-foreground/70">
										{variant.lang}
									</span>
								</Menu.Item>
							);
						})}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}

function StartClaudeButton() {
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label="Start Claude in folder"
			title="Start Claude in folder"
			onClick={() => void startClaude()}
		>
			<MingcuteTerminalAiLine className="size-4" />
		</Button>
	);
}

function NoteActionsMenu({ path }: { path: string }) {
	async function revealFile() {
		try {
			await desktopApi.revealFile(path);
		} catch {
			toast.error("Failed to reveal file");
		}
	}

	async function copyFilePath() {
		try {
			await navigator.clipboard.writeText(path);
			toast.success("File path copied");
		} catch {
			toast.error("Failed to copy file path");
		}
	}

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Note actions"
						title="Note actions"
					/>
				}
			>
				<MingcuteMore2Line className="size-4" />
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner align="end" side="bottom" sideOffset={4}>
					<Menu.Popup className="z-50 w-44 origin-(--transform-origin) rounded-sm border border-border bg-popover p-1 text-[11px] text-popover-foreground outline-hidden transition-[transform,opacity] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
						<Menu.Item
							className="flex w-full cursor-pointer items-center gap-2 rounded-sm [padding-block:0.375rem] [padding-inline:0.5rem] text-start text-[11px] outline-hidden select-none data-highlighted:bg-accent"
							onClick={() => void revealFile()}
						>
							<MingcuteFolderOpenLine className="size-3 shrink-0" />
							<span className="min-w-0 flex-1">
								{revealFileLabel(desktopApi.platform)}
							</span>
							<ShortcutHint>⌘⌥R</ShortcutHint>
						</Menu.Item>
						<Menu.Item
							className="flex w-full cursor-pointer items-center gap-2 rounded-sm [padding-block:0.375rem] [padding-inline:0.5rem] text-start text-[11px] outline-hidden select-none data-highlighted:bg-accent"
							onClick={() => void copyFilePath()}
						>
							<MingcuteCopy2Line className="size-3 shrink-0" />
							<span className="min-w-0 flex-1">Copy file path</span>
							<ShortcutHint>⌘⇧C</ShortcutHint>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}

function ShortcutHint({ children }: { children: string }) {
	return (
		<span
			className="ms-auto shrink-0 text-[11px] leading-none text-muted-foreground/60"
			aria-hidden="true"
		>
			{children}
		</span>
	);
}
