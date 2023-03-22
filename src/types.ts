export interface TableOfContentsPluginSettings {
  listStyle: "bullet" | "number";
  minimumDepth: number;
  maximumDepth: number;
  title?: string;
  useMarkdown: boolean
  githubCompat?: boolean
}
