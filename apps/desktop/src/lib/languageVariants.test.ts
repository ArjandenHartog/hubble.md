import { describe, expect, it } from "vitest";
import { findLanguageVariants } from "./languageVariants";

describe("findLanguageVariants", () => {
	it("detects language-folder variants", () => {
		const files = [
			"en/guide/intro.md",
			"nl/guide/intro.md",
			"de/guide/intro.md",
			"en/guide/other.md",
		];
		const result = findLanguageVariants("nl/guide/intro.md", files);
		expect(result?.current).toBe("nl");
		expect(result?.variants.map((v) => v.lang)).toEqual(["de", "en", "nl"]);
		expect(result?.variants.map((v) => v.relPath)).toContain(
			"en/guide/intro.md",
		);
	});

	it("detects language-suffix variants", () => {
		const files = [
			"guide/intro.en.md",
			"guide/intro.nl.md",
			"guide/other.en.md",
		];
		const result = findLanguageVariants("guide/intro.en.md", files);
		expect(result?.current).toBe("en");
		expect(result?.variants.map((v) => v.lang)).toEqual(["en", "nl"]);
	});

	it("returns null for single-language files", () => {
		expect(
			findLanguageVariants("guide/intro.md", [
				"guide/intro.md",
				"guide/other.md",
			]),
		).toBeNull();
		expect(findLanguageVariants("en/intro.md", ["en/intro.md"])).toBeNull();
	});

	it("ignores non-language leading folders", () => {
		// "docs" is not a language code, so this is not a multi-language set.
		expect(
			findLanguageVariants("docs/intro.md", ["docs/intro.md", "src/intro.md"]),
		).toBeNull();
	});

	it("provides friendly labels", () => {
		const result = findLanguageVariants("en/intro.md", [
			"en/intro.md",
			"nl/intro.md",
		]);
		const labels = Object.fromEntries(
			(result?.variants ?? []).map((v) => [v.lang, v.label]),
		);
		expect(labels.en).toBe("English");
		expect(labels.nl).toBe("Nederlands");
	});
});
