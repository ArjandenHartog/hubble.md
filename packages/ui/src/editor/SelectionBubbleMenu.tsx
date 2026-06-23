import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
	type ComponentType,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import MingcuteBoldLine from "~icons/mingcute/bold-line";
import MingcuteCodeLine from "~icons/mingcute/code-line";
import MingcuteItalicLine from "~icons/mingcute/italic-line";
import MingcuteLinkLine from "~icons/mingcute/link-line";
import MingcuteStrikethroughLine from "~icons/mingcute/strikethrough-line";
import { cn } from "../lib/utils";
import { Button } from "../primitives/button";
import { useCommandMenuPosition } from "./commandMenuPosition";

type MenuPosition = {
	x: number;
	y: number;
};

type BubbleItem = {
	kind: string;
	label: string;
	icon: ComponentType<{ className?: string }>;
	isActive: (editor: Editor) => boolean;
	run: (editor: Editor) => void;
};

const BUBBLE_ITEMS: BubbleItem[] = [
	{
		kind: "bold",
		label: "Bold",
		icon: MingcuteBoldLine,
		isActive: (editor) => editor.isActive("bold"),
		run: (editor) =>
			editor
				.chain()
				.focus(undefined, { scrollIntoView: false })
				.toggleBold()
				.run(),
	},
	{
		kind: "italic",
		label: "Italic",
		icon: MingcuteItalicLine,
		isActive: (editor) => editor.isActive("italic"),
		run: (editor) =>
			editor
				.chain()
				.focus(undefined, { scrollIntoView: false })
				.toggleItalic()
				.run(),
	},
	{
		kind: "code",
		label: "Inline code",
		icon: MingcuteCodeLine,
		isActive: (editor) => editor.isActive("code"),
		run: (editor) =>
			editor
				.chain()
				.focus(undefined, { scrollIntoView: false })
				.toggleCode()
				.run(),
	},
	{
		kind: "strike",
		label: "Strikethrough",
		icon: MingcuteStrikethroughLine,
		isActive: (editor) => editor.isActive("strike"),
		run: (editor) =>
			editor
				.chain()
				.focus(undefined, { scrollIntoView: false })
				.toggleStrike()
				.run(),
	},
	{
		kind: "link",
		label: "Link",
		icon: MingcuteLinkLine,
		isActive: (editor) => editor.isActive("link"),
		run: (editor) => {
			editor.commands.focus(undefined, { scrollIntoView: false });
			editor.commands.toggleLinkAtSelection();
		},
	},
];

/**
 * Floating quick-format toolbar shown above a non-empty text selection. Inline
 * marks only apply to text, so it stays hidden inside code blocks and for node
 * selections (images, dividers).
 */
export function SelectionBubbleMenu({
	editor,
	viewportRef,
}: {
	editor: Editor | null;
	viewportRef: RefObject<HTMLDivElement | null>;
}) {
	const [pos, setPos] = useState<number | null>(null);
	const [position, setPosition] = useState<MenuPosition | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!editor) return;

		const update = () => {
			const { selection } = editor.state;
			const isTextRange =
				selection instanceof TextSelection && !selection.empty;
			if (!editor.isFocused || !isTextRange || editor.isActive("codeBlock")) {
				setPos(null);
				setPosition(null);
				return;
			}
			setPos(selection.from);
		};

		update();
		editor.on("selectionUpdate", update);
		editor.on("transaction", update);
		editor.on("focus", update);
		editor.on("blur", update);
		return () => {
			editor.off("selectionUpdate", update);
			editor.off("transaction", update);
			editor.off("focus", update);
			editor.off("blur", update);
		};
	}, [editor]);

	useCommandMenuPosition({
		editor,
		floatingRef: menuRef,
		pos,
		setPosition,
		viewportRef,
		placement: "top",
	});

	if (!editor || pos === null) return null;

	return (
		<div
			ref={menuRef}
			role="toolbar"
			aria-label="Format selection"
			className="absolute z-[6] flex items-center gap-0.5 rounded-[var(--radius-popover)] border border-border bg-popover p-1 text-popover-foreground shadow-overlay"
			// Keep the editor selection while interacting with the toolbar.
			onMouseDown={(event) => event.preventDefault()}
			style={{
				insetInlineStart: `${position?.x ?? 0}px`,
				insetBlockStart: `${position?.y ?? 0}px`,
				visibility: position ? "visible" : "hidden",
			}}
		>
			{BUBBLE_ITEMS.map((item) => {
				const Icon = item.icon;
				const active = item.isActive(editor);
				return (
					<Button
						key={item.kind}
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={item.label}
						aria-pressed={active}
						title={item.label}
						className={cn(active && "bg-accent text-foreground")}
						onClick={() => item.run(editor)}
					>
						<Icon className="size-4" />
					</Button>
				);
			})}
		</div>
	);
}
