import { describe, expect, it } from "vitest";
import { markdownToTiptapDoc } from "./markdownToProsemirror";
import { tiptapDocToMarkdown } from "./prosemirrorToMarkdown";

describe("table markdown conversion", () => {
	it("parses a GFM table into table nodes", () => {
		const doc = markdownToTiptapDoc(
			["| A | B |", "| --- | --- |", "| 1 | 2 |"].join("\n"),
		);

		expect(doc.content?.[0]).toEqual({
			type: "table",
			content: [
				{
					type: "tableRow",
					content: [
						{
							type: "tableHeader",
							attrs: { align: null },
							content: [
								{ type: "paragraph", content: [{ type: "text", text: "A" }] },
							],
						},
						{
							type: "tableHeader",
							attrs: { align: null },
							content: [
								{ type: "paragraph", content: [{ type: "text", text: "B" }] },
							],
						},
					],
				},
				{
					type: "tableRow",
					content: [
						{
							type: "tableCell",
							attrs: { align: null },
							content: [
								{ type: "paragraph", content: [{ type: "text", text: "1" }] },
							],
						},
						{
							type: "tableCell",
							attrs: { align: null },
							content: [
								{ type: "paragraph", content: [{ type: "text", text: "2" }] },
							],
						},
					],
				},
			],
		});
	});

	it("round-trips a simple table", () => {
		const markdown = ["| A | B |", "| --- | --- |", "| 1 | 2 |"].join("\n");

		expect(tiptapDocToMarkdown(markdownToTiptapDoc(markdown))).toBe(markdown);
	});

	it("preserves column alignment", () => {
		const markdown = [
			"| Left | Center | Right |",
			"| :--- | :---: | ---: |",
			"| a | b | c |",
		].join("\n");

		const doc = markdownToTiptapDoc(markdown);
		const headerCells = doc.content?.[0]?.content?.[0]?.content ?? [];
		expect(headerCells.map((cell) => cell.attrs?.align)).toEqual([
			"left",
			"center",
			"right",
		]);
		expect(tiptapDocToMarkdown(doc)).toBe(markdown);
	});

	it("preserves inline formatting and escapes pipes in cells", () => {
		const markdown = [
			"| Name | Note |",
			"| --- | --- |",
			"| **bold** | a \\| b |",
		].join("\n");

		expect(tiptapDocToMarkdown(markdownToTiptapDoc(markdown))).toBe(markdown);
	});
});
