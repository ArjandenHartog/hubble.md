import {
	computePosition,
	flip,
	offset,
	type Placement,
	shift,
	type VirtualElement,
} from "@floating-ui/dom";
import type { Editor } from "@tiptap/core";
import { type RefObject, useEffect } from "react";

type MenuPosition = {
	x: number;
	y: number;
};

const FALLBACK_PLACEMENTS: Record<Placement, Placement[]> = {
	"bottom-start": ["top-start", "bottom-end", "top-end"],
	"top-start": ["bottom-start", "top-end", "bottom-end"],
	top: ["bottom", "top-start", "bottom-start"],
	bottom: ["top", "bottom-start", "top-start"],
	"top-end": ["bottom-end", "top-start", "bottom-start"],
	"bottom-end": ["top-end", "bottom-start", "top-start"],
	"right-start": ["left-start"],
	"left-start": ["right-start"],
	right: ["left"],
	left: ["right"],
	"right-end": ["left-end"],
	"left-end": ["right-end"],
};

function updateCommandMenuPosition({
	editor,
	viewport,
	floatingEl,
	pos,
	setPosition,
	placement,
}: {
	editor: Editor;
	viewport: HTMLDivElement;
	floatingEl: HTMLDivElement;
	pos: number;
	setPosition: (position: MenuPosition) => void;
	placement: Placement;
}) {
	const reference: VirtualElement = {
		contextElement: viewport,
		getBoundingClientRect() {
			const coords = editor.view.coordsAtPos(pos);
			return {
				x: coords.left,
				y: coords.top,
				left: coords.left,
				top: coords.top,
				right: coords.right,
				bottom: coords.bottom,
				width: coords.right - coords.left,
				height: coords.bottom - coords.top,
				toJSON() {
					return this;
				},
			};
		},
	};

	return computePosition(reference, floatingEl, {
		strategy: "absolute",
		placement,
		middleware: [
			offset(6),
			flip({
				boundary: viewport,
				fallbackPlacements: FALLBACK_PLACEMENTS[placement] ?? ["bottom-start"],
				padding: 8,
			}),
			shift({
				boundary: viewport,
				padding: 8,
			}),
		],
	}).then(({ x, y }) => {
		setPosition({ x, y });
	});
}

export function useCommandMenuPosition({
	editor,
	floatingRef,
	pos,
	setPosition,
	viewportRef,
	placement = "bottom-start",
}: {
	editor: Editor | null;
	floatingRef: RefObject<HTMLDivElement | null>;
	pos: number | null;
	setPosition: (position: MenuPosition) => void;
	viewportRef: RefObject<HTMLDivElement | null>;
	placement?: Placement;
}) {
	useEffect(() => {
		if (!editor || pos === null) return;
		const viewport = viewportRef.current;
		const floatingEl = floatingRef.current;
		if (!viewport || !floatingEl) return;

		const update = () => {
			void updateCommandMenuPosition({
				editor,
				viewport,
				floatingEl,
				pos,
				setPosition,
				placement,
			});
		};

		update();
		viewport.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);

		return () => {
			viewport.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, [editor, floatingRef, pos, setPosition, viewportRef, placement]);
}
