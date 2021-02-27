import endent from "endent";
import { CachedMetadata, HeadingCache } from "obsidian";
import { TableOfContentsPluginSettings } from "./types";

export interface CursorPosition {
  line: number;
  ch: number;
}

export const getCurrentHeaderDepth = (
  headings: HeadingCache[],
  cursor: CursorPosition
): number => {
  const previousHeadings = headings.filter(
    (heading) => heading.position.end.line < cursor.line
  );

  if (!previousHeadings.length) {
    return 0;
  }

  return previousHeadings[previousHeadings.length - 1].level;
};

const getSubsequentHeadings = (
  headings: HeadingCache[],
  cursor: CursorPosition
): HeadingCache[] => {
  return headings.filter((heading) => heading.position.end.line > cursor.line);
};

export const createToc = (
  { headings = [] }: CachedMetadata,
  cursor: CursorPosition,
  settings: TableOfContentsPluginSettings
): string | undefined => {
  const currentDepth = getCurrentHeaderDepth(headings, cursor);
  const subsequentHeadings = getSubsequentHeadings(headings, cursor);
  const includedHeadings: HeadingCache[] = [];

  for (const heading of subsequentHeadings) {
    if (heading.level <= currentDepth) {
      break;
    }

    if (
      heading.level >= settings.minimumDepth &&
      heading.level <= settings.maximumDepth
    ) {
      includedHeadings.push(heading);
    }
  }

  if (!includedHeadings.length) {
    return;
  }

  const firstHeadingDepth = includedHeadings[0].level
  const links = includedHeadings.map((heading) => {
    const itemIndication = (settings.listStyle === "number" && "1.") || "-";
    const indent = new Array(Math.max(0, heading.level - firstHeadingDepth))
      .fill("\t")
      .join("");

    return `${indent}${itemIndication} [[#${heading.heading}|${heading.heading}]]`;
  });

  return endent`
    ${settings.title ? `${settings.title}\n` : ""}
    ${`${links.join("\n")}\n`}
  `;
};
