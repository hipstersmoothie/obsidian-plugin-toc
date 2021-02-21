import endent from "endent";
import { TableOfContentsPluginSettings } from "./types";

export interface CursorPosition {
  line: number;
  ch: number;
}

const positionToCursorOffset = (
  code: string,
  { line, ch }: CursorPosition
): number => {
  return code.split("\n").reduce((pos, currLine, index) => {
    if (index < line) {
      return pos + currLine.length + 1;
    }

    if (index === line) {
      return pos + ch;
    }

    return pos;
  }, 0);
};

const getDepth = (header: string) => {
  const [hashes] = header.split(" ");
  return hashes.length;
};

export const getCurrentHeaderDepth = (
  code: string,
  cursor: CursorPosition
): number => {
  const position = positionToCursorOffset(code, cursor);
  const precedingText = code.slice(0, position);
  const lines = precedingText.split("\n").reverse();

  let currentDepth = 0;

  for (const line of lines) {
    if (line.match(/^[#]{1,6} /)) {
      currentDepth = getDepth(line);
      break;
    }
  }

  return currentDepth;
};

export const createToc = (
  code: string,
  cursor: CursorPosition,
  settings: TableOfContentsPluginSettings
): string | undefined => {
  const position = positionToCursorOffset(code, cursor);
  const currentDepth = getCurrentHeaderDepth(code, cursor);
  const afterText = code.slice(position).split("\n");
  const headers: string[] = [];
  const HEADER_REGEX = new RegExp(
    `^[#]{${settings.minimumDepth},${settings.maximumDepth}} `
  );

  for (const line of afterText) {
    if (line.match(HEADER_REGEX)) {
      const depth = getDepth(line);

      if (depth <= currentDepth) {
        break;
      }

      headers.push(line);
    }
  }

  if (!headers.length) {
    return;
  }

  const links = headers.map((header) => {
    const [hashes, ...words] = header.split(" ");
    const title = words.join(" ");
    const itemIndication = (settings.listStyle === "number" && "1.") || "-";
    const indent = new Array(Math.max(0, hashes.length - currentDepth - 1))
      .fill("\t")
      .join("");

    return `${indent}${itemIndication} [[#${title}|${title}]]`;
  });

  return endent`
    ${settings.title ? `${settings.title}\n` : ""}
    ${links.join("\n")}
  `;
};
