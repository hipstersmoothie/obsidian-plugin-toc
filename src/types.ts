export interface TableOfContentsPluginSettings {
  listStyle: "bullet" | "number";
  minimumDepth: number;
  maximumDepth: number;
  title?: string;
  indentText?: string;
  linkMask?: string;
}
