import {
	Table,
	TableCell,
	TableHeader,
	TableRow,
} from "@tiptap/extension-table";

export type TableCellAlign = "left" | "center" | "right" | null;

// Markdown (GFM) carries column alignment, but ProseMirror table cells don't
// track it by default. Store it per cell so it round-trips through the Markdown
// serializer and renders as text-align.
const alignAttribute = {
	align: {
		default: null as TableCellAlign,
		parseHTML: (element: HTMLElement): TableCellAlign => {
			const value =
				element.style.textAlign || element.getAttribute("data-align") || "";
			return value === "left" || value === "center" || value === "right"
				? value
				: null;
		},
		renderHTML: (attributes: { align?: TableCellAlign }) => {
			if (!attributes.align) return {};
			return {
				style: `text-align: ${attributes.align}`,
				"data-align": attributes.align,
			};
		},
	},
};

const AlignedTableHeader = TableHeader.extend({
	addAttributes() {
		return { ...this.parent?.(), ...alignAttribute };
	},
});

const AlignedTableCell = TableCell.extend({
	addAttributes() {
		return { ...this.parent?.(), ...alignAttribute };
	},
});

export const tableExtensions = [
	Table.configure({ resizable: true, allowTableNodeSelection: true }),
	TableRow,
	AlignedTableHeader,
	AlignedTableCell,
];
