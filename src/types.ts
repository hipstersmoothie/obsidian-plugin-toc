import type { CachedMetadata } from "obsidian";

/**
 * Enum for list styles.
 * TODO: Add todo style (god knows who would want to use that, but for completeness sake)
 * 
 * @author dbarenholz
 */
export const ListStyleEnum = {
  bullet: "bullet",
  number: "number",
  none: "none",
};

/**
 * Settings interface; see individual comments.
 * 
 * @author Andrew Lisowski (source); dbarenholz (edits)
 */
export interface TableOfContentsPluginSettings {
  // Bullets; Numbers; None.
  listStyle: string;
  // Whether or not to put in > block.
  isQuoted: boolean;
  // Min depth to include
  minimumDepth: number;
  // Max depth to include
  maximumDepth: number;
  // For setting a title
  title?: string;
}

/**
 * Current cursor position in terms of line and character number
 * 
 * @author Andrew Lisowski
 */
export interface CursorPosition {
  line: number;
  ch: number;
}

/**
 * @author Andrew Lisowski
 */
export type GetSettings = (data: CachedMetadata, cursor: CodeMirror.Position) => TableOfContentsPluginSettings;

/**
 * The default settings.
 * 
 * @author dbarenholz
 */
export const DEFAULT_SETTINGS: TableOfContentsPluginSettings = {
  listStyle: ListStyleEnum.number,
  isQuoted: false,
  minimumDepth: 2,
  maximumDepth: 6,
};
