// Multi-language docs (e.g. PulseDocs) keep the same document in several
// languages. Two conventions are common and both are supported here:
//   1. Language folders:  en/guide/intro.md, nl/guide/intro.md
//   2. Language suffixes:  guide/intro.en.md, guide/intro.nl.md
// Given the open file, we surface the matching variants so the user can switch
// language. All paths in this module are workspace-relative and use "/".

const LANGUAGE_CODES = new Set([
	"en",
	"nl",
	"de",
	"fr",
	"es",
	"it",
	"pt",
	"ja",
	"zh",
	"ko",
	"ru",
	"pl",
	"sv",
	"da",
	"no",
	"fi",
	"cs",
	"tr",
	"ar",
	"he",
	"hi",
	"id",
	"th",
	"vi",
	"uk",
	"ro",
	"hu",
	"el",
	"bg",
	"hr",
	"sk",
	"sl",
	"sr",
	"lt",
	"lv",
	"et",
	"ca",
	"ms",
	"fa",
	"bn",
	"ta",
]);

const LANGUAGE_NAMES: Record<string, string> = {
	en: "English",
	nl: "Nederlands",
	de: "Deutsch",
	fr: "Français",
	es: "Español",
	it: "Italiano",
	pt: "Português",
	ja: "日本語",
	zh: "中文",
	ko: "한국어",
	ru: "Русский",
	pl: "Polski",
	sv: "Svenska",
	da: "Dansk",
	no: "Norsk",
	fi: "Suomi",
	cs: "Čeština",
	tr: "Türkçe",
	uk: "Українська",
};

const SUFFIX_PATTERN =
	/^(.*)\.([A-Za-z]{2}(?:-[A-Za-z]{2})?)\.(md|markdown|mdown)$/;

export type LanguageVariant = {
	/** Lowercased language code, e.g. "en" or "pt-br". */
	lang: string;
	/** Human-friendly label for the language. */
	label: string;
	/** Workspace-relative path of this variant. */
	relPath: string;
};

export type LanguageVariants = {
	current: string;
	variants: LanguageVariant[];
};

function baseCode(code: string): string {
	return code.toLowerCase().split("-")[0];
}

function isLanguageCode(segment: string): boolean {
	return LANGUAGE_CODES.has(baseCode(segment));
}

function labelFor(code: string): string {
	const base = baseCode(code);
	const name = LANGUAGE_NAMES[base];
	if (!name) return code.toUpperCase();
	return base === code ? name : `${name} (${code.toUpperCase()})`;
}

/**
 * Find the language variants of `relPath` among `relPaths`. Returns null when
 * the file is not part of a multi-language set (fewer than two variants).
 */
export function findLanguageVariants(
	relPath: string,
	relPaths: string[],
): LanguageVariants | null {
	const folder = folderConventionVariants(relPath, relPaths);
	if (folder) return folder;
	return suffixConventionVariants(relPath, relPaths);
}

function folderConventionVariants(
	relPath: string,
	relPaths: string[],
): LanguageVariants | null {
	const segments = relPath.split("/");
	if (segments.length < 2 || !isLanguageCode(segments[0])) return null;
	const rest = segments.slice(1).join("/");
	const current = segments[0].toLowerCase();

	const variants: LanguageVariant[] = [];
	for (const candidate of relPaths) {
		const parts = candidate.split("/");
		if (parts.length < 2 || !isLanguageCode(parts[0])) continue;
		if (parts.slice(1).join("/") !== rest) continue;
		variants.push({
			lang: parts[0].toLowerCase(),
			label: labelFor(parts[0]),
			relPath: candidate,
		});
	}
	return finalizeVariants(current, variants);
}

function suffixConventionVariants(
	relPath: string,
	relPaths: string[],
): LanguageVariants | null {
	const match = SUFFIX_PATTERN.exec(relPath);
	if (!match) return null;
	const [, base, code, ext] = match;
	if (!isLanguageCode(code)) return null;
	const current = code.toLowerCase();

	const variants: LanguageVariant[] = [];
	for (const candidate of relPaths) {
		const candidateMatch = SUFFIX_PATTERN.exec(candidate);
		if (!candidateMatch) continue;
		const [, candidateBase, candidateCode, candidateExt] = candidateMatch;
		if (candidateBase !== base || candidateExt !== ext) continue;
		if (!isLanguageCode(candidateCode)) continue;
		variants.push({
			lang: candidateCode.toLowerCase(),
			label: labelFor(candidateCode),
			relPath: candidate,
		});
	}
	return finalizeVariants(current, variants);
}

function finalizeVariants(
	current: string,
	variants: LanguageVariant[],
): LanguageVariants | null {
	const unique = new Map<string, LanguageVariant>();
	for (const variant of variants) {
		if (!unique.has(variant.lang)) unique.set(variant.lang, variant);
	}
	if (unique.size < 2) return null;
	return {
		current,
		variants: [...unique.values()].sort((a, b) => a.lang.localeCompare(b.lang)),
	};
}
