import endent from "endent";
import { CachedMetadata, HeadingCache, Notice } from "obsidian";
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
    const indentText = (settings.indentText || "\t").replace("\\t", "\t");
    const indent = new Array(Math.max(0, heading.level - firstHeadingDepth))
      .fill(indentText)
      .join("");

    let head = heading.heading;
    if (settings.replace !== "") {
      head = head.replaceAll(" ", settings.replace);
    }
    console.log(head, settings.replace);
    const view = settings.linkMask
      ? settings.linkMask
          .replaceAll("{{indent}}", indent)
          .replaceAll("{{itemIndication}}", itemIndication)
          .replaceAll("{{heading}}", head)
      : `${indent}${itemIndication} [[#${head}|${head}]]`;

    return view;
  });

  return endent`
    ${settings.title ? `${settings.title}\n` : ""}
    ${`${links.join("\n")}\n`}
  `;
};
