import endent from "endent";
import { CachedMetadata, HeadingCache, Notice } from "obsidian";
import { TableOfContentsPluginSettings } from "./types";
import anchor from 'anchor-markdown-header';

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

const getPreviousLevelHeading = (headings: HeadingCache[], currentHeading: HeadingCache) => {
  const index = headings.indexOf(currentHeading);
  const targetHeadings = headings.slice(0, index).reverse();
  return targetHeadings.find((item, _index, _array) => {
    return item.level == currentHeading.level - 1;
  });
}

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
    const itemIndication = (settings.listStyle === "number" && "1.") || "-";
    const indent = new Array(Math.max(0, heading.level - firstHeadingDepth))
      .fill("\t")
      .join("");
    const previousLevelHeading = getPreviousLevelHeading(includedHeadings, heading);

    const prefix = `${indent}${itemIndication}`;
    const displayText = heading.heading;
    let linkText;

    if (settings.useMarkdown && settings.githubCompat)
      return `${prefix} ${anchor(heading.heading)}`;
    else if (settings.useMarkdown) 
      linkText = encodeURI(heading.heading);
    else if (typeof previousLevelHeading == "undefined")
      linkText = heading.heading;
    else 
      linkText = `${previousLevelHeading.heading}#${heading.heading}`;

    // wikilink format
    if (!settings.useMarkdown)
      return `${prefix} [[#${linkText}|${displayText}]]`;
    // markdown format
    else 
      return `${prefix} [${displayText}](#${linkText})`;
  });

  return endent`
    ${settings.title ? `${settings.title}\n` : ""}
    ${`${links.join("\n")}\n`}
  `;
};
