import endent from "endent";
import { CachedMetadata, HeadingCache, Notice } from "obsidian";
import { TableOfContentsPluginSettings, CursorPosition, ListStyleEnum } from "./types";

/**
 * Grabs current header depth.
 * 
 * @param headings Headings from the file
 * @param cursor Cursor position
 * @returns Depth of current header [0 or higher]
 */
export const getCurrentHeaderDepth = (headings: HeadingCache[], cursor: CursorPosition): number => {
  const previousHeadings = headings.filter((heading) => heading.position.end.line < cursor.line);

  if (!previousHeadings.length) {
    return 0;
  }

  return previousHeadings[previousHeadings.length - 1].level;
};

/**
 * Grabs all subsequent headings
 * 
 * @param headings Headings from file
 * @param cursor Cursos position
 * @returns HeadingCache of subsequent headers
 */
const getSubsequentHeadings = (headings: HeadingCache[], cursor: CursorPosition): HeadingCache[] => {
  return headings.filter((heading) => heading.position.end.line > cursor.line);
};

/**
 * Creates the TOC.
 * 
 * @param param0 Some cached metadata, containing headers. 
 * @param cursor Cursor position
 * @param settings Plugin settings
 * @returns A markdown-based string containing the TOC, or undefined when no TOC is needed.
 */
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

    if (heading.level >= settings.minimumDepth && heading.level <= settings.maximumDepth) {
      includedHeadings.push(heading);
    }
  }

  if (!includedHeadings.length) {
    new Notice(
      endent`
        No headings below cursor matched settings 
        (min: ${settings.minimumDepth}) (max: ${settings.maximumDepth})
      `
    );
    return;
  }

  const firstHeadingDepth = includedHeadings[0].level;
  const links = includedHeadings.map((heading) => {
    let itemIndication = null;
    let itemIndentation = null;
    let wantIndentation = null;

    switch (settings.listStyle) {
      case ListStyleEnum.number:
        itemIndication = "1.";
        wantIndentation = true;
        break;
      case ListStyleEnum.bullet:
        itemIndication = "- ";
        wantIndentation = true;
      default:
        itemIndication = "";
        wantIndentation = false;
        itemIndentation = "";
        break;
    }

    if (wantIndentation) {
      // Get indentation. If listStyle is none, then no indentation
      itemIndentation = new Array(Math.max(0, heading.level - firstHeadingDepth)).fill("\t").join("");
    }

    const itemQuoteCharacter = settings.isQuoted ? "> " : "";
    const TOCentry = `${itemQuoteCharacter}${itemIndentation}${itemIndication} [[#${heading.heading}|${heading.heading}]]`;
    return TOCentry;
  });

  return endent`
    ${settings.title ? `${settings.title}\n` : ""}
    ${`${links.join("\n")}\n`}
  `;
};
