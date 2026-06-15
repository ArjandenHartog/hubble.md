// @vitest-environment happy-dom

import { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import { HubbleCodeBlock } from "./CodeBlockExtension";

const editors: Editor[] = [];

afterEach(() => {
	for (const editor of editors) editor.destroy();
	editors.length = 0;
});

describe("code block editor extension", () => {
	it("inserts spaces for Tab inside code blocks", () => {
		const editor = createCodeBlockEditor();

		expect(editor.commands.keyboardShortcut("Tab")).toBe(true);

		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "codeBlock",
			attrs: { language: "ts" },
			content: [{ type: "text", text: "const x = 1;    " }],
		});
	});

	it("deletes a soft-tab segment with Backspace inside leading indentation", () => {
		const editor = createCodeBlockEditor("    const x = 1;", 5);

		expect(editor.commands.keyboardShortcut("Backspace")).toBe(true);

		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "codeBlock",
			attrs: { language: "ts" },
			content: [{ type: "text", text: "const x = 1;" }],
		});
	});
});

function createCodeBlockEditor(text = "const x = 1;", cursorPos?: number) {
	const editor = new Editor({
		element: document.createElement("div"),
		extensions: [StarterKit.configure({ codeBlock: false }), HubbleCodeBlock],
		content: {
			type: "doc",
			content: [
				{
					type: "codeBlock",
					attrs: { language: "ts" },
					content: [{ type: "text", text }],
				},
			],
		},
	});
	editors.push(editor);
	Object.defineProperty(editor, "isFocused", { value: true });
	const codeBlock = editor.state.doc.firstChild;
	if (!codeBlock) throw new Error("Expected code block");
	editor.view.dispatch(
		editor.state.tr.setSelection(
			TextSelection.create(
				editor.state.doc,
				cursorPos ?? codeBlock.nodeSize - 1,
			),
		),
	);
	return editor;
}
