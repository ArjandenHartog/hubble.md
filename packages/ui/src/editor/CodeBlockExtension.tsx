import { Select } from "@base-ui/react/select";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TextSelection } from "@tiptap/pm/state";
import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { useState } from "react";
import MingcuteCopy2Line from "~icons/mingcute/copy-2-line";
import MingcuteSelectorVerticalLine from "~icons/mingcute/selector-vertical-line";
import { Button } from "../primitives/button";

const TAB_SIZE = 4;

const lowlight = createLowlight(common);
lowlight.registerAlias({
	javascript: ["js", "jsx"],
	typescript: ["ts", "tsx"],
	xml: ["html"],
	bash: ["sh", "shell"],
	markdown: ["md"],
});

export const HubbleCodeBlock = CodeBlockLowlight.extend({
	addKeyboardShortcuts() {
		return {
			...this.parent?.(),
			Backspace: ({ editor }) => {
				const { state } = editor;
				const { selection } = state;
				if (!selection.empty) return false;

				const { $from } = selection;
				if ($from.parent.type !== this.type) return false;

				const blockStart = $from.start();
				const textBeforeCursor = state.doc.textBetween(
					blockStart,
					$from.pos,
					"\n",
					"\n",
				);
				const lineStart = textBeforeCursor.lastIndexOf("\n") + 1;
				const column = textBeforeCursor.length - lineStart;
				const linePrefix = textBeforeCursor.slice(lineStart);

				if (
					column === 0 ||
					column % TAB_SIZE !== 0 ||
					linePrefix.length !== column ||
					!/^\s+$/.test(linePrefix) ||
					!linePrefix.endsWith(" ".repeat(TAB_SIZE))
				) {
					return false;
				}

				return editor.commands.command(({ tr }) => {
					const from = $from.pos - TAB_SIZE;
					tr.delete(from, $from.pos);
					tr.setSelection(TextSelection.create(tr.doc, from));
					return true;
				});
			},
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockView);
	},
}).configure({
	lowlight,
	enableTabIndentation: true,
	tabSize: TAB_SIZE,
});

function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
	const language =
		typeof node.attrs.language === "string" ? node.attrs.language : "";
	const [copied, setCopied] = useState(false);

	return (
		<NodeViewWrapper className="pm-code-block" as="div">
			<div className="pm-code-block-controls" contentEditable={false}>
				<Select.Root
					value={language}
					onValueChange={(next) => updateAttributes({ language: next || null })}
				>
					<Select.Trigger
						render={
							<Button
								type="button"
								variant="ghost"
								size="xs"
								aria-label="Code block language"
								title="Code block language"
								className="pm-code-block-language"
							/>
						}
					>
						<Select.Value>
							{languageLabel(language) || "Plain text"}
						</Select.Value>
						<MingcuteSelectorVerticalLine
							className="size-3.5 shrink-0 text-muted-foreground"
							aria-hidden="true"
						/>
					</Select.Trigger>
					<Select.Portal>
						<Select.Positioner align="end" side="bottom" sideOffset={4}>
							<Select.Popup className="z-50 w-40 origin-(--transform-origin) rounded-[var(--radius-popover)] border border-border bg-popover p-1 text-[11px] text-popover-foreground shadow-overlay outline-hidden transition-[transform,opacity] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
								{codeBlockLanguages.map((option) => (
									<Select.Item
										key={option.value}
										value={option.value}
										className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1 text-start text-[11px] text-foreground outline-hidden select-none data-highlighted:bg-accent"
									>
										<Select.ItemText>{option.label}</Select.ItemText>
									</Select.Item>
								))}
							</Select.Popup>
						</Select.Positioner>
					</Select.Portal>
				</Select.Root>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					aria-label="Copy code"
					title={copied ? "Copied" : "Copy code"}
					onClick={() => {
						void navigator.clipboard.writeText(node.textContent).then(() => {
							setCopied(true);
							window.setTimeout(() => setCopied(false), 1200);
						});
					}}
				>
					<MingcuteCopy2Line className="size-3.5" />
				</Button>
			</div>
			<pre>
				<NodeViewContent<"code">
					as="code"
					className={language ? `language-${language}` : undefined}
				/>
			</pre>
		</NodeViewWrapper>
	);
}

function languageLabel(value: string) {
	return codeBlockLanguages.find((option) => option.value === value)?.label;
}

const codeBlockLanguages = [
	{ value: "", label: "Plain text" },
	{ value: "js", label: "JavaScript" },
	{ value: "ts", label: "TypeScript" },
	{ value: "jsx", label: "JSX" },
	{ value: "tsx", label: "TSX" },
	{ value: "json", label: "JSON" },
	{ value: "css", label: "CSS" },
	{ value: "html", label: "HTML" },
	{ value: "md", label: "Markdown" },
	{ value: "sh", label: "Shell" },
	{ value: "python", label: "Python" },
	{ value: "rust", label: "Rust" },
	{ value: "go", label: "Go" },
] as const;
